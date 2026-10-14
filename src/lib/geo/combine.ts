import { RoadFeature, MultiLineStringGeometry, Coordinate } from "@/types/road";
import { calculateGeometryLengthMeters, calculateBoundingBox } from "./geometry";

/**
 * Combines two or more RoadFeatures into a single multipart RoadFeature.
 *
 * CRITICAL RULE:
 * Preserves all source coordinate sequences. Disconnected geometries remain
 * as separate components in a MultiLineString.
 * NEVER connects disconnected pieces or invents artificial geometry.
 */
export function combineFeatures(
  featuresToCombine: RoadFeature[],
  newName: string
): RoadFeature {
  if (featuresToCombine.length < 2) {
    throw new Error("At least two features are required to perform a combination.");
  }

  const combinedLines: Coordinate[][] = [];

  for (const feature of featuresToCombine) {
    if (feature.geometry.type === "LineString") {
      // Add as one distinct line component
      combinedLines.push([...feature.geometry.coordinates]);
    } else {
      // Feature is MultiLineString: preserve each sub-component line
      for (const line of feature.geometry.coordinates) {
        combinedLines.push([...line]);
      }
    }
  }

  const geometry: MultiLineStringGeometry = {
    type: "MultiLineString",
    coordinates: combinedLines,
  };

  const lengthMeters = calculateGeometryLengthMeters(geometry);
  const bbox = calculateBoundingBox(geometry);
  const coordinateCount = combinedLines.reduce((sum, line) => sum + line.length, 0);

  // Preserve source descriptions and metadata
  const descriptions = featuresToCombine
    .map((f) => f.description)
    .filter((d): d is string => Boolean(d));

  const combinedDescription =
    descriptions.length > 0 ? Array.from(new Set(descriptions)).join(" | ") : undefined;

  const combinedFeature: RoadFeature = {
    id: `combined-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: newName.trim() || "Combined Road",
    description: combinedDescription,
    geometry,
    visible: true,
    properties: {
      combinedFromCount: featuresToCombine.length,
      combinedFromIds: featuresToCombine.map((f) => f.id),
      combinedFromNames: featuresToCombine.map((f) => f.name),
    },
    metadata: {
      componentCount: combinedLines.length,
      coordinateCount,
      lengthMeters,
      bbox,
    },
  };

  return combinedFeature;
}
