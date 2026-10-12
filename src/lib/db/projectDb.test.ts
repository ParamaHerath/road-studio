import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoadFeature, ImportSummary } from "@/types/road";

// Mock idb module
const mockStore = new Map<string, unknown>();

vi.mock("idb", () => ({
  openDB: vi.fn().mockImplementation(async () => ({
    put: vi.fn().mockImplementation(async (_store: string, val: unknown, key: string) => {
      mockStore.set(key, val);
      return key;
    }),
    get: vi.fn().mockImplementation(async (_store: string, key: string) => {
      return mockStore.get(key) || null;
    }),
    delete: vi.fn().mockImplementation(async (_store: string, key: string) => {
      mockStore.delete(key);
    }),
  })),
}));

import {
  saveProjectSession,
  loadProjectSession,
  clearProjectSession,
} from "./projectDb";

describe("IndexedDB Project Storage", () => {
  const sampleFeatures: RoadFeature[] = [
    {
      id: "road-1",
      name: "A1 Colombo - Kandy Road",
      visible: true,
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [79.86, 6.92],
          [80.63, 7.29],
        ],
      },
      metadata: {
        componentCount: 1,
        coordinateCount: 2,
        lengthMeters: 115000,
        bbox: [79.86, 6.92, 80.63, 7.29],
      },
    },
  ];

  const sampleSummary: ImportSummary = {
    filename: "test.kml",
    featureCount: 1,
    lineComponentCount: 1,
    coordinateCount: 2,
    totalLengthMeters: 115000,
    unsupportedCount: 0,
    unsupportedTypes: [],
    warnings: [],
  };

  beforeEach(() => {
    mockStore.clear();
    Object.defineProperty(window, "indexedDB", {
      value: {},
      writable: true,
      configurable: true,
    });
  });

  it("saves and loads project session successfully", async () => {
    const saved = await saveProjectSession(
      sampleFeatures,
      new Set(["road-1"]),
      sampleSummary,
      "My Sri Lanka Network"
    );
    expect(saved).toBe(true);

    const loaded = await loadProjectSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.features.length).toBe(1);
    expect(loaded?.features[0].name).toBe("A1 Colombo - Kandy Road");
    expect(loaded?.selectedFeatureIds).toEqual(["road-1"]);
    expect(loaded?.metadata.name).toBe("My Sri Lanka Network");
    expect(loaded?.importSummary?.filename).toBe("test.kml");
  });

  it("clears project session successfully", async () => {
    await saveProjectSession(
      sampleFeatures,
      new Set(["road-1"]),
      sampleSummary
    );

    const cleared = await clearProjectSession();
    expect(cleared).toBe(true);

    const loadedAfterClear = await loadProjectSession();
    expect(loadedAfterClear).toBeNull();
  });
});
