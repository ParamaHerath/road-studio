import { describe, it, expect } from "vitest";
import { combineFeatures } from "./combine";
import { RoadFeature } from "@/types/road";

describe("combineFeatures", () => {
  const lineA: RoadFeature = {
    id: "line-a",
    name: "A1 Colombo Segment",
    description: "Western province",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.86, 6.92],
        [79.88, 6.94],
      ],
    },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: 2,
      lengthMeters: 3000,
      bbox: [79.86, 6.92, 79.88, 6.94],
    },
  };

  const lineB: RoadFeature = {
    id: "line-b",
    name: "A1 Kandy Segment",
    description: "Central province",
    geometry: {
      type: "LineString",
      coordinates: [
        [80.60, 7.28],
        [80.63, 7.30],
      ],
    },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: 2,
      lengthMeters: 4000,
      bbox: [80.60, 7.28, 80.63, 7.30],
    },
  };

  it("combines two disconnected LineString features into a MultiLineString without connecting them", () => {
    const combined = combineFeatures([lineA, lineB], "A1 Kandy Road");

    expect(combined.name).toBe("A1 Kandy Road");
    expect(combined.geometry.type).toBe("MultiLineString");
    expect(combined.geometry.coordinates).toHaveLength(2);

    // Component 1 matches lineA exactly
    expect(combined.geometry.coordinates[0]).toEqual(lineA.geometry.coordinates);

    // Component 2 matches lineB exactly
    expect(combined.geometry.coordinates[1]).toEqual(lineB.geometry.coordinates);

    // No connecting line: component 1 end (79.88, 6.94) is NOT joined to component 2 start (80.60, 7.28)
    expect(combined.metadata.componentCount).toBe(2);
    expect(combined.metadata.coordinateCount).toBe(4);
  });

  it("combines features containing existing MultiLineString preserving all sub-components", () => {
    const multiFeature: RoadFeature = {
      id: "multi-1",
      name: "Multipart Road",
      geometry: {
        type: "MultiLineString",
        coordinates: [
          [
            [79.90, 6.95],
            [79.92, 6.97],
          ],
          [
            [79.95, 7.00],
            [79.97, 7.02],
          ],
        ],
      },
      visible: true,
      properties: {},
      metadata: {
        componentCount: 2,
        coordinateCount: 4,
        lengthMeters: 5000,
        bbox: [79.90, 6.95, 79.97, 7.02],
      },
    };

    const combined = combineFeatures([lineA, multiFeature], "A1 Combined Network");

    expect(combined.geometry.type).toBe("MultiLineString");
    // 1 component from lineA + 2 components from multiFeature = 3 total components
    expect(combined.geometry.coordinates).toHaveLength(3);
    expect(combined.metadata.componentCount).toBe(3);
    expect(combined.metadata.coordinateCount).toBe(6);
  });

  it("throws an error when fewer than 2 features are provided", () => {
    expect(() => combineFeatures([lineA], "A1")).toThrow(
      "At least two features are required to perform a combination."
    );
  });

  it("preserves merged descriptions", () => {
    const combined = combineFeatures([lineA, lineB], "A1");
    expect(combined.description).toContain("Western province");
    expect(combined.description).toContain("Central province");
  });
});
