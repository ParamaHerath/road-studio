import { RoadFeature, Coordinate } from "@/types/road";

export interface KmlExportOptions {
  projectName?: string;
  description?: string;
  includeExtendedData?: boolean;
}

export interface KmlExportResult {
  kmlString: string;
  featureCount: number;
  lineComponentCount: number;
  coordinateCount: number;
}

/**
 * Escapes unsafe XML characters.
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

/**
 * Formats a sequence of coordinates into KML coordinate text: "lon,lat,alt lon,lat,alt"
 */
function formatKmlCoordinates(coords: Coordinate[]): string {
  return coords
    .map((c) => {
      const lon = c[0];
      const lat = c[1];
      const alt = c.length > 2 && c[2] !== undefined ? c[2] : 0;
      return `${lon},${lat},${alt}`;
    })
    .join(" ");
}

/**
 * Serializes RoadFeature items into valid, Google Earth Pro-compliant OGC KML 2.2 text.
 */
export function serializeRoadFeaturesToKml(
  features: RoadFeature[],
  options: KmlExportOptions = {}
): KmlExportResult {
  const projectName = options.projectName || "Road Studio Export";
  const projectDesc =
    options.description || "Edited highway network exported from Road Studio";
  const includeExtended = options.includeExtendedData !== false;

  let totalCoordinates = 0;
  let totalLineComponents = 0;

  const placemarksXml: string[] = [];

  for (const feature of features) {
    const escapedName = escapeXml(feature.name);
    const escapedDesc = feature.description ? escapeXml(feature.description) : "";

    let geometryXml = "";

    if (feature.geometry.type === "LineString") {
      const coords = feature.geometry.coordinates;
      totalCoordinates += coords.length;
      totalLineComponents += 1;

      geometryXml = `      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${formatKmlCoordinates(coords)}</coordinates>
      </LineString>`;
    } else if (feature.geometry.type === "MultiLineString") {
      const lines = feature.geometry.coordinates;
      totalLineComponents += lines.length;

      const lineStringsXml = lines
        .map((lineCoords) => {
          totalCoordinates += lineCoords.length;
          return `        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${formatKmlCoordinates(lineCoords)}</coordinates>
        </LineString>`;
        })
        .join("\n");

      geometryXml = `      <MultiGeometry>
${lineStringsXml}
      </MultiGeometry>`;
    }

    let extendedDataXml = "";
    if (includeExtended) {
      extendedDataXml = `      <ExtendedData>
        <Data name="roadStudioId">
          <value>${escapeXml(feature.id)}</value>
        </Data>
        <Data name="componentCount">
          <value>${feature.metadata.componentCount}</value>
        </Data>
        <Data name="coordinateCount">
          <value>${feature.metadata.coordinateCount}</value>
        </Data>
        <Data name="lengthMeters">
          <value>${feature.metadata.lengthMeters.toFixed(2)}</value>
        </Data>
      </ExtendedData>`;
    }

    placemarksXml.push(`    <Placemark id="${escapeXml(feature.id)}">
      <name>${escapedName}</name>
${escapedDesc ? `      <description>${escapedDesc}</description>\n` : ""}${extendedDataXml ? `${extendedDataXml}\n` : ""}      <styleUrl>#road-studio-line</styleUrl>
${geometryXml}
    </Placemark>`);
  }

  const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
  <Document>
    <name>${escapeXml(projectName)}</name>
    <description>${escapeXml(projectDesc)}</description>
    <open>1</open>
    <Style id="road-studio-line">
      <LineStyle>
        <color>ffe08b38</color>
        <width>3.5</width>
      </LineStyle>
    </Style>
${placemarksXml.join("\n")}
  </Document>
</kml>`;

  return {
    kmlString,
    featureCount: features.length,
    lineComponentCount: totalLineComponents,
    coordinateCount: totalCoordinates,
  };
}

/**
 * Triggers a browser download of a KML text string as a .kml file.
 */
export function downloadKmlFile(kmlContent: string, filename: string): void {
  const safeFilename = filename.endsWith(".kml") ? filename : `${filename}.kml`;
  const blob = new Blob([kmlContent], {
    type: "application/vnd.google-earth.kml+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
