import { ImportResult, RoadFeature, RoadGeometry } from "@/types/road";

function coordinateKey(coordinate: readonly number[]): string {
  return coordinate.join(",");
}

function lineKey(line: readonly (readonly number[])[]): string {
  const forward = line.map(coordinateKey).join(";");
  const reverse = [...line].reverse().map(coordinateKey).join(";");
  return forward < reverse ? forward : reverse;
}

function geometryKey(geometry: RoadGeometry): string {
  const lines =
    geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;

  return lines.map(lineKey).sort().join("|");
}

/**
 * Keeps only imported features whose geometry is not already in the workspace.
 * Direction and component ordering do not affect duplicate detection.
 */
export function filterDuplicateFeatures(
  importedFeatures: RoadFeature[],
  existingFeatures: RoadFeature[]
): { features: RoadFeature[]; duplicateCount: number } {
  const existingKeys = new Set(existingFeatures.map((feature) => geometryKey(feature.geometry)));
  const importedKeys = new Set<string>();
  const features: RoadFeature[] = [];
  let duplicateCount = 0;

  for (const feature of importedFeatures) {
    const key = geometryKey(feature.geometry);
    if (existingKeys.has(key) || importedKeys.has(key)) {
      duplicateCount++;
      continue;
    }

    importedKeys.add(key);
    features.push(feature);
  }

  return { features, duplicateCount };
}

export function createFilteredImportResult(
  result: ImportResult,
  existingFeatures: RoadFeature[]
): ImportResult {
  if (!result.success) return result;

  const { features, duplicateCount } = filterDuplicateFeatures(result.features, existingFeatures);
  const warnings = [...result.summary.warnings];

  if (duplicateCount > 0) {
    warnings.push(
      `${duplicateCount} path${duplicateCount === 1 ? "" : "s"} already exist${duplicateCount === 1 ? "s" : ""} and ${duplicateCount === 1 ? "was" : "were"} skipped.`
    );
  }

  if (features.length === 0) {
    return {
      ...result,
      success: true,
      features: [],
      duplicateCount,
      summary: {
        ...result.summary,
        warnings,
      },
    };
  }

  return {
    ...result,
    features,
    duplicateCount,
    summary: {
      ...result.summary,
      featureCount: features.length,
      lineComponentCount: features.reduce(
        (total, feature) => total + feature.metadata.componentCount,
        0
      ),
      coordinateCount: features.reduce(
        (total, feature) => total + feature.metadata.coordinateCount,
        0
      ),
      totalLengthMeters: features.reduce(
        (total, feature) => total + feature.metadata.lengthMeters,
        0
      ),
      warnings,
    },
  };
}
