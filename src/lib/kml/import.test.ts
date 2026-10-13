import { describe, expect, it } from "vitest";
import { createFilteredImportResult } from "./import";
import type { ImportResult, RoadFeature } from "@/types/road";

function feature(id: string, coordinates: [number, number][]): RoadFeature {
  return {
    id,
    name: id,
    geometry: { type: "LineString", coordinates },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: coordinates.length,
      lengthMeters: 10,
      bbox: [0, 0, 1, 1],
    },
  };
}

function result(features: RoadFeature[]): ImportResult {
  return {
    success: true,
    features,
    summary: {
      filename: "sample.kml",
      featureCount: features.length,
      lineComponentCount: features.length,
      coordinateCount: features.reduce((sum, item) => sum + item.metadata.coordinateCount, 0),
      totalLengthMeters: features.length * 10,
      unsupportedCount: 0,
      unsupportedTypes: [],
      warnings: [],
    },
  };
}

describe("createFilteredImportResult", () => {
  it("reports when every path already exists without treating the KML as corrupt", () => {
    const existing = [feature("existing", [[0, 0], [1, 1]])];
    const filtered = createFilteredImportResult(
      result([feature("incoming", [[0, 0], [1, 1]])]),
      existing
    );

    expect(filtered.success).toBe(true);
    expect(filtered.features).toHaveLength(0);
    expect(filtered.error).toBeUndefined();
    expect(filtered.summary.warnings).toContain("1 path already exists and was skipped.");
  });

  it("keeps only new paths and reports skipped duplicates", () => {
    const existing = [feature("existing", [[0, 0], [1, 1]])];
    const filtered = createFilteredImportResult(
      result([
        feature("duplicate", [[1, 1], [0, 0]]),
        feature("new", [[2, 2], [3, 3]]),
      ]),
      existing
    );

    expect(filtered.success).toBe(true);
    expect(filtered.features.map((item) => item.id)).toEqual(["new"]);
    expect(filtered.summary.featureCount).toBe(1);
    expect(filtered.summary.warnings).toContain("1 path already exists and was skipped.");
  });

  it("also removes duplicate paths within the same file", () => {
    const filtered = createFilteredImportResult(
      result([
        feature("first", [[0, 0], [1, 1]]),
        feature("second", [[0, 0], [1, 1]]),
      ]),
      []
    );

    expect(filtered.features.map((item) => item.id)).toEqual(["first"]);
    expect(filtered.summary.warnings).toContain("1 path already exists and was skipped.");
  });
});
