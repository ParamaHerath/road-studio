import { describe, it, expect } from "vitest";
import { RoadFeature } from "@/types/road";
import { serializeRoadFeaturesToKml } from "./serializer";
import { parseKmlString } from "./parser";

describe("KML Serializer and Round-Trip Verification", () => {
  const singleLineFeature: RoadFeature = {
    id: "road-a1",
    name: "A1 Colombo - Kandy Road & Express",
    description: "Major highway linking Western & Central provinces <primary>",
    visible: true,
    properties: { source: "test" },
    geometry: {
      type: "LineString",
      coordinates: [
        [79.8612, 6.9271],
        [79.9123, 6.9543],
        [80.6350, 7.2906],
      ],
    },
    metadata: {
      componentCount: 1,
      coordinateCount: 3,
      lengthMeters: 115000,
      bbox: [79.8612, 6.9271, 80.6350, 7.2906],
    },
  };

  const multiLineFeature: RoadFeature = {
    id: "road-a2",
    name: "A2 Galle Road (Multipart)",
    description: "Coastal route with bypass section",
    visible: true,
    properties: { source: "test" },
    geometry: {
      type: "MultiLineString",
      coordinates: [
        [
          [79.8500, 6.9000],
          [79.8700, 6.8500],
        ],
        [
          [79.9200, 6.7000],
          [79.9500, 6.6500],
        ],
      ],
    },
    metadata: {
      componentCount: 2,
      coordinateCount: 4,
      lengthMeters: 45000,
      bbox: [79.8500, 6.6500, 79.9500, 6.9000],
    },
  };

  it("serializes single LineString feature into valid KML with escaped XML", () => {
    const result = serializeRoadFeaturesToKml([singleLineFeature]);
    expect(result.featureCount).toBe(1);
    expect(result.coordinateCount).toBe(3);
    expect(result.lineComponentCount).toBe(1);

    expect(result.kmlString).toContain("<kml xmlns=\"http://www.opengis.net/kml/2.2\"");
    expect(result.kmlString).toContain("<name>A1 Colombo - Kandy Road &amp; Express</name>");
    expect(result.kmlString).toContain("&lt;primary&gt;");
    expect(result.kmlString).toContain("<LineString>");
    expect(result.kmlString).toContain("79.8612,6.9271,0 79.9123,6.9543,0 80.635,7.2906,0");
  });

  it("serializes MultiLineString feature into MultiGeometry with separate LineStrings", () => {
    const result = serializeRoadFeaturesToKml([multiLineFeature]);
    expect(result.featureCount).toBe(1);
    expect(result.lineComponentCount).toBe(2);
    expect(result.coordinateCount).toBe(4);

    expect(result.kmlString).toContain("<MultiGeometry>");
    expect(result.kmlString).toContain("79.85,6.9,0 79.87,6.85,0");
    expect(result.kmlString).toContain("79.92,6.7,0 79.95,6.65,0");
  });

  it("survives complete round-trip (export -> parse) with exact coordinate and metadata preservation", () => {
    const originalFeatures = [singleLineFeature, multiLineFeature];

    // 1. Export
    const { kmlString } = serializeRoadFeaturesToKml(originalFeatures, {
      projectName: "Sri Lanka Highway Redesign",
    });

    // 2. Parse back
    const parsed = parseKmlString(kmlString, "roundtrip.kml");

    expect(parsed.success).toBe(true);
    expect(parsed.features.length).toBe(2);

    // Feature 1: Single LineString
    const f1 = parsed.features[0];
    expect(f1.name).toBe("A1 Colombo - Kandy Road & Express");
    expect(f1.geometry.type).toBe("LineString");
    if (f1.geometry.type === "LineString") {
      expect(f1.geometry.coordinates.length).toBe(3);
      expect(f1.geometry.coordinates[0][0]).toBeCloseTo(79.8612, 4);
      expect(f1.geometry.coordinates[0][1]).toBeCloseTo(6.9271, 4);
      expect(f1.geometry.coordinates[2][0]).toBeCloseTo(80.6350, 4);
      expect(f1.geometry.coordinates[2][1]).toBeCloseTo(7.2906, 4);
    }

    // Feature 2: MultiLineString
    const f2 = parsed.features[1];
    expect(f2.name).toBe("A2 Galle Road (Multipart)");
    expect(f2.geometry.type).toBe("MultiLineString");
    if (f2.geometry.type === "MultiLineString") {
      expect(f2.geometry.coordinates.length).toBe(2);
      expect(f2.geometry.coordinates[0][0][0]).toBeCloseTo(79.8500, 4);
      expect(f2.geometry.coordinates[1][1][0]).toBeCloseTo(79.9500, 4);
    }
  });

  it("handles empty feature list without error", () => {
    const result = serializeRoadFeaturesToKml([]);
    expect(result.featureCount).toBe(0);
    expect(result.coordinateCount).toBe(0);
    expect(result.kmlString).toContain("<Document>");
  });
});
