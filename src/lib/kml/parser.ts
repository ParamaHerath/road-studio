import { kml } from "@tmcw/togeojson";
import {
  RoadFeature,
  RoadGeometry,
  Coordinate,
  ImportResult,
  ImportSummary,
} from "@/types/road";
import {
  calculateGeometryLengthMeters,
  calculateBoundingBox,
  sanitizeKmlText,
} from "@/lib/geo/geometry";

/**
 * Parses raw KML text into validated RoadFeature models, tracking summaries and unsupported constructs.
 */
export function parseKmlString(rawKml: string, filename = "imported.kml"): ImportResult {
  const trimmed = rawKml.trim();
  if (!trimmed) {
    return {
      success: false,
      features: [],
      summary: createEmptySummary(filename),
      error: "The provided KML file is empty.",
      rawKml,
    };
  }

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(trimmed, "application/xml");

    // Check for XML parsing errors (DOMParser generates a <parsererror> element)
    const parserError = doc.querySelector("parsererror");
    if (parserError) {
      return {
        success: false,
        features: [],
        summary: createEmptySummary(filename),
        error: `Malformed KML XML: ${sanitizeKmlText(parserError.textContent) || "Syntax error"}`,
        rawKml,
      };
    }
  } catch (err) {
    return {
      success: false,
      features: [],
      summary: createEmptySummary(filename),
      error: `Failed to parse XML: ${err instanceof Error ? err.message : String(err)}`,
      rawKml,
    };
  }

  // Check for supported root / KML tags
  const isKml = doc.querySelector("kml") || doc.querySelector("Document") || doc.querySelector("Placemark");
  if (!isKml) {
    return {
      success: false,
      features: [],
      summary: createEmptySummary(filename),
      error: "The file is valid XML but does not appear to be a KML document (missing <kml>, <Document>, or <Placemark> elements).",
      rawKml,
    };
  }

  // Detect unsupported KML constructs for reporting
  const unsupportedTypes: string[] = [];
  const unsupportedSelectors: Record<string, string> = {
    NetworkLink: "NetworkLink",
    GroundOverlay: "GroundOverlay",
    ScreenOverlay: "ScreenOverlay",
    PhotoOverlay: "PhotoOverlay",
    Tour: "Tour, gx\\:Tour",
    Model: "Model",
  };

  let unsupportedCount = 0;
  for (const [name, selector] of Object.entries(unsupportedSelectors)) {
    try {
      const elements = doc.querySelectorAll(selector);
      if (elements.length > 0) {
        unsupportedTypes.push(`${name} (${elements.length})`);
        unsupportedCount += elements.length;
      }
    } catch {
      // Ignore complex selector exceptions if any
    }
  }

  // Parse via togeojson
  let geojson: GeoJSON.FeatureCollection<GeoJSON.Geometry | null>;
  try {
    geojson = kml(doc);
  } catch (err) {
    return {
      success: false,
      features: [],
      summary: createEmptySummary(filename),
      error: `Error converting KML to GeoJSON: ${err instanceof Error ? err.message : String(err)}`,
      rawKml,
    };
  }

  const features: RoadFeature[] = [];
  let lineComponentCount = 0;
  let coordinateCount = 0;
  let totalLengthMeters = 0;
  const warnings: string[] = [];

  if (unsupportedCount > 0) {
    warnings.push(
      `Detected ${unsupportedCount} non-linear KML constructs that are bypassed: ${unsupportedTypes.join(", ")}.`
    );
  }

  let index = 0;
  for (const item of geojson.features) {
    index++;
    const geomType = item.geometry?.type;

    // Filter for LineString, MultiLineString, or GeometryCollection
    if (
      geomType !== "LineString" &&
      geomType !== "MultiLineString" &&
      geomType !== "GeometryCollection"
    ) {
      if (geomType) {
        unsupportedCount++;
        if (!unsupportedTypes.includes(geomType)) {
          unsupportedTypes.push(geomType);
        }
      }
      continue;
    }

    let roadGeometry: RoadGeometry | null = null;

    if (geomType === "LineString") {
      const validCoords = extractValidCoords((item.geometry as GeoJSON.LineString).coordinates);
      if (validCoords.length === 0) {
        warnings.push(`Feature #${index} contains zero valid coordinates; skipping.`);
        continue;
      }
      roadGeometry = {
        type: "LineString",
        coordinates: validCoords,
      };
      lineComponentCount += 1;
      coordinateCount += validCoords.length;
    } else if (geomType === "MultiLineString") {
      const rawLines = (item.geometry as GeoJSON.MultiLineString).coordinates;
      const validLines: Coordinate[][] = [];

      for (const line of rawLines) {
        const validCoords = extractValidCoords(line);
        if (validCoords.length > 0) {
          validLines.push(validCoords);
          coordinateCount += validCoords.length;
        }
      }

      if (validLines.length === 0) {
        warnings.push(`MultiLine feature #${index} contains zero valid line segments; skipping.`);
        continue;
      }

      roadGeometry = {
        type: "MultiLineString",
        coordinates: validLines,
      };
      lineComponentCount += validLines.length;
    } else if (geomType === "GeometryCollection") {
      const geomCollection = item.geometry as GeoJSON.GeometryCollection;
      const lineGeometries = geomCollection.geometries.filter(
        (g): g is GeoJSON.LineString => g.type === "LineString"
      );

      if (lineGeometries.length === 0) {
        unsupportedCount++;
        if (!unsupportedTypes.includes("GeometryCollection (non-linear)")) {
          unsupportedTypes.push("GeometryCollection (non-linear)");
        }
        continue;
      }

      const validLines: Coordinate[][] = [];
      for (const ls of lineGeometries) {
        const validCoords = extractValidCoords(ls.coordinates);
        if (validCoords.length > 0) {
          validLines.push(validCoords);
          coordinateCount += validCoords.length;
        }
      }

      if (validLines.length === 0) {
        warnings.push(`GeometryCollection #${index} contains zero valid line coordinates; skipping.`);
        continue;
      }

      if (validLines.length === 1) {
        roadGeometry = {
          type: "LineString",
          coordinates: validLines[0],
        };
        lineComponentCount += 1;
      } else {
        roadGeometry = {
          type: "MultiLineString",
          coordinates: validLines,
        };
        lineComponentCount += validLines.length;
      }
    }

    if (!roadGeometry) continue;

    const lengthMeters = calculateGeometryLengthMeters(roadGeometry);
    totalLengthMeters += lengthMeters;
    const bbox = calculateBoundingBox(roadGeometry);

    const rawName = typeof item.properties?.name === "string" ? item.properties.name : "";
    const sanitizedName = sanitizeKmlText(rawName) || `Unnamed Road ${features.length + 1}`;

    const rawDesc =
      typeof item.properties?.description === "string" ? item.properties.description : undefined;
    const sanitizedDesc = rawDesc ? sanitizeKmlText(rawDesc) : undefined;

    const featureId = `road-${Date.now().toString(36)}-${features.length + 1}`;

    const feature: RoadFeature = {
      id: featureId,
      name: sanitizedName,
      description: sanitizedDesc,
      geometry: roadGeometry,
      visible: true,
      properties: { ...(item.properties || {}) },
      originalKmlId: typeof item.id === "string" ? item.id : undefined,
      metadata: {
        componentCount: roadGeometry.type === "LineString" ? 1 : roadGeometry.coordinates.length,
        coordinateCount:
          roadGeometry.type === "LineString"
            ? roadGeometry.coordinates.length
            : roadGeometry.coordinates.reduce((sum, l) => sum + l.length, 0),
        lengthMeters,
        bbox,
      },
    };

    features.push(feature);
  }

  if (features.length === 0) {
    return {
      success: false,
      features: [],
      summary: {
        filename,
        featureCount: 0,
        lineComponentCount: 0,
        coordinateCount: 0,
        totalLengthMeters: 0,
        unsupportedCount,
        unsupportedTypes,
        warnings,
      },
      error: "No road line features (LineString or MultiLineString) were found in the KML file.",
      rawKml,
    };
  }

  const summary: ImportSummary = {
    filename,
    featureCount: features.length,
    lineComponentCount,
    coordinateCount,
    totalLengthMeters,
    unsupportedCount,
    unsupportedTypes,
    warnings,
  };

  return {
    success: true,
    features,
    summary,
    rawKml,
  };
}

function createEmptySummary(filename: string): ImportSummary {
  return {
    filename,
    featureCount: 0,
    lineComponentCount: 0,
    coordinateCount: 0,
    totalLengthMeters: 0,
    unsupportedCount: 0,
    unsupportedTypes: [],
    warnings: [],
  };
}

function extractValidCoords(rawCoords: GeoJSON.Position[]): Coordinate[] {
  const valid: Coordinate[] = [];
  for (const pt of rawCoords) {
    const [lon, lat, alt] = pt;
    if (typeof lon === "number" && typeof lat === "number" && !isNaN(lon) && !isNaN(lat)) {
      valid.push(alt !== undefined ? [lon, lat, alt] : [lon, lat]);
    }
  }
  return valid;
}

