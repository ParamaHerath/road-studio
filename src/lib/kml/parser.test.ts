import { describe, it, expect } from "vitest";
import { parseKmlString } from "./parser";
import {
  FIXTURE_CONSECUTIVE_SEGMENTS,
  FIXTURE_DISCONNECTED_SAME_NAME,
  FIXTURE_BYPASS_BRANCH,
  FIXTURE_ROUNDABOUT,
  FIXTURE_REVERSED_COORDINATES,
  FIXTURE_DUPLICATE_ENDPOINTS,
  FIXTURE_NEARLY_COINCIDENT_ENDPOINTS,
  FIXTURE_MULTIPART_LINE,
  FIXTURE_MISSING_METADATA,
  FIXTURE_WITH_UNSUPPORTED_CONSTRUCTS,
  FIXTURE_MALFORMED_XML,
  FIXTURE_NON_KML_XML,
  FIXTURE_EMPTY,
} from "./fixtures";
import { haversineDistanceMeters } from "../geo/geometry";

describe("KML Parser", () => {
  it("parses valid consecutive road segments and preserves names and coordinates", () => {
    const result = parseKmlString(FIXTURE_CONSECUTIVE_SEGMENTS, "consecutive.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(2);
    expect(result.summary.featureCount).toBe(2);
    expect(result.summary.lineComponentCount).toBe(2);
    expect(result.summary.coordinateCount).toBe(6);

    const f1 = result.features[0];
    expect(f1.name).toBe("A1 Segment 1 - Colombo to Kelaniya");
    expect(f1.geometry.type).toBe("LineString");
    if (f1.geometry.type === "LineString") {
      expect(f1.geometry.coordinates).toHaveLength(3);
      expect(f1.geometry.coordinates[0][0]).toBeCloseTo(79.8612);
      expect(f1.geometry.coordinates[0][1]).toBeCloseTo(6.9271);
    }
  });

  it("parses disconnected road sections with the same name as distinct features", () => {
    const result = parseKmlString(FIXTURE_DISCONNECTED_SAME_NAME, "disconnected.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(2);
    expect(result.features[0].name).toBe("A1 Road");
    expect(result.features[1].name).toBe("A1 Road");
    expect(result.features[0].description).toBe("Section in Western Province");
    expect(result.features[1].description).toBe("Section in Central Province");
    expect(result.features[0].id).not.toBe(result.features[1].id);
  });

  it("parses a bypass branching from a main road", () => {
    const result = parseKmlString(FIXTURE_BYPASS_BRANCH, "bypass.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(2);
    expect(result.features.map((f) => f.name)).toContain("A1 Main Highway");
    expect(result.features.map((f) => f.name)).toContain("Kadawatha Bypass");
  });

  it("parses a roundabout with feeder approach roads", () => {
    const result = parseKmlString(FIXTURE_ROUNDABOUT, "roundabout.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(3);
    const ring = result.features.find((f) => f.name.includes("Roundabout Ring"));
    expect(ring).toBeDefined();
    expect(ring?.geometry.coordinates).toHaveLength(5);
  });

  it("preserves reversed coordinate sequences without altering order during import", () => {
    const result = parseKmlString(FIXTURE_REVERSED_COORDINATES, "reversed.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(2);

    const f1 = result.features[0];
    const f2 = result.features[1];
    if (f1.geometry.type === "LineString" && f2.geometry.type === "LineString") {
      // Both end at the junction (79.9000, 6.9300)
      const last1 = f1.geometry.coordinates[f1.geometry.coordinates.length - 1];
      const last2 = f2.geometry.coordinates[f2.geometry.coordinates.length - 1];
      expect(last1[0]).toBeCloseTo(79.9000);
      expect(last1[1]).toBeCloseTo(6.9300);
      expect(last2[0]).toBeCloseTo(79.9000);
      expect(last2[1]).toBeCloseTo(6.9300);
    }
  });

  it("preserves road features with duplicate consecutive coordinates", () => {
    const result = parseKmlString(FIXTURE_DUPLICATE_ENDPOINTS, "duplicate.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(1);
    expect(result.features[0].metadata.coordinateCount).toBe(4);
  });

  it("calculates accurate distances between nearly coincident endpoints", () => {
    const result = parseKmlString(FIXTURE_NEARLY_COINCIDENT_ENDPOINTS, "nearly-coincident.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(2);

    const f1 = result.features[0];
    const f2 = result.features[1];
    if (f1.geometry.type === "LineString" && f2.geometry.type === "LineString") {
      const end1 = f1.geometry.coordinates[f1.geometry.coordinates.length - 1];
      const start2 = f2.geometry.coordinates[0];
      const gapMeters = haversineDistanceMeters(end1, start2);
      expect(gapMeters).toBeGreaterThan(0);
      expect(gapMeters).toBeLessThan(10); // Gap is ~3-4 meters
    }
  });

  it("imports multipart geometries as MultiLineString preserving sub-components", () => {
    const result = parseKmlString(FIXTURE_MULTIPART_LINE, "multipart.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(1);

    const f = result.features[0];
    expect(f.geometry.type).toBe("MultiLineString");
    if (f.geometry.type === "MultiLineString") {
      expect(f.geometry.coordinates).toHaveLength(2);
      expect(f.metadata.componentCount).toBe(2);
      expect(f.metadata.coordinateCount).toBe(6);
    }
  });

  it("provides sensible fallbacks for features with missing name and description", () => {
    const result = parseKmlString(FIXTURE_MISSING_METADATA, "missing.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(1);
    expect(result.features[0].name).toMatch(/Unnamed Road 1/);
    expect(result.features[0].description).toBeUndefined();
  });

  it("bypasses unsupported KML constructs, extracts valid road lines, and reports summary", () => {
    const result = parseKmlString(FIXTURE_WITH_UNSUPPORTED_CONSTRUCTS, "mixed.kml");
    expect(result.success).toBe(true);
    expect(result.features).toHaveLength(1);
    expect(result.features[0].name).toBe("Valid Road Line");
    expect(result.summary.unsupportedCount).toBeGreaterThan(0);
    expect(result.summary.warnings.length).toBeGreaterThan(0);
  });

  it("handles malformed XML cleanly with descriptive error", () => {
    const result = parseKmlString(FIXTURE_MALFORMED_XML, "broken.kml");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Malformed KML XML/);
    expect(result.features).toHaveLength(0);
  });

  it("rejects non-KML XML documents", () => {
    const result = parseKmlString(FIXTURE_NON_KML_XML, "rss.xml");
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/does not appear to be a KML document/);
  });

  it("rejects empty files with clear error message", () => {
    const result = parseKmlString(FIXTURE_EMPTY, "empty.kml");
    expect(result.success).toBe(false);
    expect(result.error).toBe("The provided KML file is empty.");
  });
});
