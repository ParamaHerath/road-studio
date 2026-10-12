import { describe, it, expect } from "vitest";
import { findJoinCandidates, joinFeatures } from "./join";
import { RoadFeature } from "@/types/road";

describe("Join Endpoints Logic", () => {
  const seg1: RoadFeature = {
    id: "seg-1",
    name: "Colombo to Kelaniya",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.86, 6.92],
        [79.89, 6.94],
        [79.92, 6.96],
      ],
    },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 3, lengthMeters: 5000, bbox: [79.86, 6.92, 79.92, 6.96] },
  };

  const seg2: RoadFeature = {
    id: "seg-2",
    name: "Kelaniya to Kadawatha",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.92, 6.96],
        [79.94, 6.98],
        [79.96, 7.00],
      ],
    },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 3, lengthMeters: 5000, bbox: [79.92, 6.96, 79.96, 7.00] },
  };

  it("finds touching endpoints with zero gap distance", () => {
    const candidates = findJoinCandidates(seg1, seg2);
    expect(candidates.length).toBeGreaterThan(0);

    const best = candidates[0];
    expect(best.gapDistanceMeters).toBeCloseTo(0);
    expect(best.endpointA.position).toBe("end");
    expect(best.endpointB.position).toBe("start");
    expect(best.needsReverseA).toBe(false);
    expect(best.needsReverseB).toBe(false);
  });

  it("joins touching endpoints into continuous line and avoids duplicate vertex", () => {
    const candidates = findJoinCandidates(seg1, seg2);
    const joined = joinFeatures(seg1, seg2, candidates[0], "A1 Colombo-Kadawatha");

    expect(joined.name).toBe("A1 Colombo-Kadawatha");
    expect(joined.geometry.type).toBe("LineString");
    // 3 + 3 - 1 duplicate = 5 vertices
    expect(joined.geometry.coordinates).toHaveLength(5);
    expect(joined.geometry.coordinates[0]).toEqual([79.86, 6.92]);
    expect(joined.geometry.coordinates[4]).toEqual([79.96, 7.00]);
  });

  it("detects reversed coordinate order and requires reversal", () => {
    const reversedSeg2: RoadFeature = {
      id: "seg-2-rev",
      name: "Kadawatha to Kelaniya (Reversed)",
      geometry: {
        type: "LineString",
        coordinates: [
          [79.96, 7.00],
          [79.94, 6.98],
          [79.92, 6.96], // Ends at junction with seg1
        ],
      },
      visible: true,
      properties: {},
      metadata: { componentCount: 1, coordinateCount: 3, lengthMeters: 5000, bbox: [79.92, 6.96, 79.96, 7.00] },
    };

    const candidates = findJoinCandidates(seg1, reversedSeg2);
    expect(candidates.length).toBeGreaterThan(0);

    const best = candidates[0];
    expect(best.gapDistanceMeters).toBeCloseTo(0);
    // Both end at (79.92, 6.96)
    expect(best.endpointA.position).toBe("end");
    expect(best.endpointB.position).toBe("end");
    expect(best.needsReverseB).toBe(true);

    const joined = joinFeatures(seg1, reversedSeg2, best, "A1 Reversed Join");
    expect(joined.geometry.coordinates).toHaveLength(5);
    expect(joined.geometry.coordinates[4]).toEqual([79.96, 7.00]);
  });

  it("warns about ambiguous connections when multiple close candidates exist", () => {
    // A closed loop or equal-length circular piece where start and end are close
    const loopSeg: RoadFeature = {
      id: "loop",
      name: "Small Loop",
      geometry: {
        type: "LineString",
        coordinates: [
          [79.9200, 6.9600],
          [79.9205, 6.9605],
          [79.9201, 6.9600], // Start and end are very close to seg1's end
        ],
      },
      visible: true,
      properties: {},
      metadata: { componentCount: 1, coordinateCount: 3, lengthMeters: 50, bbox: [79.92, 6.96, 79.921, 6.961] },
    };

    const candidates = findJoinCandidates(seg1, loopSeg);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].isAmbiguous).toBe(true);
    expect(candidates[0].ambiguityReason).toBeDefined();
  });
});
