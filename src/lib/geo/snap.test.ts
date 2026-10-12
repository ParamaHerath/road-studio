import { describe, it, expect } from "vitest";
import { RoadFeature } from "@/types/road";
import {
  findSnapCandidates,
  validateSnapProposal,
  applySnap,
  SnapMode,
} from "./snap";

function createFeature(
  id: string,
  name: string,
  coordinates: [number, number][]
): RoadFeature {
  return {
    id,
    name,
    visible: true,
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
    metadata: {
      componentCount: 1,
      coordinateCount: coordinates.length,
      lengthMeters: 1000,
      bbox: [0, 0, 1, 1],
    },
  };
}

describe("Snap Geometry & Validation Utilities", () => {
  it("finds nearby endpoints within search tolerance", () => {
    // Feature A: ends at [79.8600, 6.9270]
    // Feature B: starts at [79.8601, 6.9270] (~11m away)
    const featA = createFeature("f1", "A1-West", [
      [79.8500, 6.9270],
      [79.8600, 6.9270],
    ]);
    const featB = createFeature("f2", "A1-East", [
      [79.8601, 6.9270],
      [79.8700, 6.9270],
    ]);

    const candidates = findSnapCandidates(featA, featB, 15);
    expect(candidates.length).toBeGreaterThan(0);

    const closest = candidates[0];
    expect(closest.posA).toBe("end");
    expect(closest.posB).toBe("start");
    expect(closest.gapDistanceMeters).toBeLessThan(15);
    expect(closest.withinTolerance).toBe(true);
  });

  it("marks candidate as exceeding tolerance when gap is larger than toleranceMeters", () => {
    // ~24m gap between [79.8600, 6.9270] and [79.86022, 6.9270]
    const featA = createFeature("f1", "A1-West", [
      [79.8500, 6.9270],
      [79.8600, 6.9270],
    ]);
    const featB = createFeature("f2", "A1-East", [
      [79.86022, 6.9270],
      [79.8700, 6.9270],
    ]);

    const candidates = findSnapCandidates(featA, featB, 10);
    expect(candidates.length).toBeGreaterThan(0);
    const val = candidates[0].validation["b_to_a"];
    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes("exceeds tolerance"))).toBe(true);
  });

  it("warns about sharp alignment deflection when endpoint turns significantly", () => {
    // Feature A terminal segment: penultimate at [79.8599, 6.9270], endpoint at [79.8600, 6.9270] (heading East)
    // Snapping north to [79.8599, 6.9271] turns vector by 90 degrees
    const featA = createFeature("f1", "A1-West", [
      [79.8500, 6.9270],
      [79.8599, 6.9270],
      [79.8600, 6.9270],
    ]);
    const featB = createFeature("f2", "A1-East", [
      [79.8599, 6.9271],
      [79.8600, 6.9280],
    ]);

    // Test a_to_b mode where A's endpoint snaps sharply north
    const val = validateSnapProposal(
      featA,
      featB,
      "end",
      [79.8600, 6.9270],
      "start",
      [79.8599, 6.9271],
      15,
      25,
      "a_to_b"
    );

    expect(val.deflectionDegA).toBeDefined();
    expect(val.deflectionDegA!).toBeGreaterThan(45);
    expect(val.warnings.some((w) => w.includes("Noticeable alignment deflection"))).toBe(true);
  });

  it("detects zero-length collapse if snapped endpoint equals penultimate coordinate", () => {
    // Feature A: [79.8500, 6.9270] -> [79.8600, 6.9270]
    // If A moves to B which happens to be at [79.8500, 6.9270]
    const featA = createFeature("f1", "A1-West", [
      [79.8500, 6.9270],
      [79.8600, 6.9270],
    ]);
    const featB = createFeature("f2", "A1-East", [
      [79.8500, 6.9270],
      [79.8700, 6.9270],
    ]);

    const val = validateSnapProposal(
      featA,
      featB,
      "end",
      [79.8600, 6.9270],
      "start",
      [79.8500, 6.9270],
      10,
      1000,
      "a_to_b"
    );

    expect(val.isValid).toBe(false);
    expect(val.errors.some((e) => e.includes("duplicate coordinates"))).toBe(true);
  });

  it("applySnap correctly modifies endpoints in b_to_a, a_to_b, and midpoint modes", () => {
    const featA = createFeature("f1", "A1-West", [
      [79.8500, 6.9270],
      [79.8600, 6.9270],
    ]);
    const featB = createFeature("f2", "A1-East", [
      [79.8601, 6.9270],
      [79.8700, 6.9270],
    ]);

    const candidates = findSnapCandidates(featA, featB, 25);
    const candidate = candidates[0];

    // 1. Mode: b_to_a -> B starts at A's endpoint
    const resBtoA = applySnap(featA, featB, candidate, "b_to_a");
    const newCoordsA = resBtoA.updatedFeatureA.geometry.coordinates as [number, number][];
    const newCoordsB = resBtoA.updatedFeatureB.geometry.coordinates as [number, number][];
    expect(newCoordsA[1]).toEqual([79.8600, 6.9270]);
    expect(newCoordsB[0]).toEqual([79.8600, 6.9270]);

    // 2. Mode: a_to_b -> A ends at B's endpoint
    const resAtoB = applySnap(featA, featB, candidate, "a_to_b");
    const newCoordsA2 = resAtoB.updatedFeatureA.geometry.coordinates as [number, number][];
    const newCoordsB2 = resAtoB.updatedFeatureB.geometry.coordinates as [number, number][];
    expect(newCoordsA2[1]).toEqual([79.8601, 6.9270]);
    expect(newCoordsB2[0]).toEqual([79.8601, 6.9270]);

    // 3. Mode: midpoint -> Both meet at midpoint
    const resMid = applySnap(featA, featB, candidate, "midpoint");
    const newCoordsAMid = resMid.updatedFeatureA.geometry.coordinates as [number, number][];
    const newCoordsBMid = resMid.updatedFeatureB.geometry.coordinates as [number, number][];
    expect(newCoordsAMid[1][0]).toBeCloseTo(79.86005, 5);
    expect(newCoordsBMid[0][0]).toBeCloseTo(79.86005, 5);
  });
});
