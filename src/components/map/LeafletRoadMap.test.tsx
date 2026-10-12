import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { LeafletRoadMap } from "./LeafletRoadMap";
import { RoadFeature } from "@/types/road";

// Mock Leaflet methods to run reliably in jsdom environment
const mockPolyline = {
  on: vi.fn().mockReturnThis(),
  setStyle: vi.fn().mockReturnThis(),
  bindTooltip: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
};

const mockFeatureGroup = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn().mockReturnThis(),
  addLayer: vi.fn().mockReturnThis(),
  getBounds: vi.fn().mockReturnValue({
    isValid: vi.fn().mockReturnValue(true),
  }),
};

const mockMap = {
  invalidateSize: vi.fn(),
  fitBounds: vi.fn(),
  remove: vi.fn(),
  removeLayer: vi.fn(),
  addLayer: vi.fn(),
};

vi.mock("leaflet", () => {
  return {
    default: {
      map: vi.fn(() => mockMap),
      featureGroup: vi.fn(() => mockFeatureGroup),
      polyline: vi.fn(() => mockPolyline),
      circleMarker: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
      tileLayer: vi.fn(() => ({ addTo: vi.fn().mockReturnThis() })),
      latLngBounds: vi.fn(() => ({ isValid: () => true })),
      DomEvent: { stopPropagation: vi.fn() },
    },
  };
});

describe("LeafletRoadMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleFeature: RoadFeature = {
    id: "f-1",
    name: "A1 Road",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.86, 6.92],
        [79.92, 6.96],
      ],
    },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: 2,
      lengthMeters: 10000,
      bbox: [79.86, 6.92, 79.92, 6.96],
    },
  };

  it("renders map container with proper test ID", () => {
    render(
      <LeafletRoadMap
        features={[]}
        selectedFeatureIds={new Set()}
        backgroundMode="osm"
      />
    );
    expect(screen.getByTestId("leaflet-map-container")).toBeInTheDocument();
  });

  it("applies canvas-grid class when minimal background mode is selected", () => {
    render(
      <LeafletRoadMap
        features={[]}
        selectedFeatureIds={new Set()}
        backgroundMode="minimal"
      />
    );
    const container = screen.getByTestId("leaflet-map-container");
    expect(container.className).toContain("canvas-grid");
  });

  it("renders polylines for visible road features", () => {
    render(
      <LeafletRoadMap
        features={[sampleFeature]}
        selectedFeatureIds={new Set(["f-1"])}
        backgroundMode="osm"
      />
    );
    expect(mockFeatureGroup.addLayer).toHaveBeenCalled();
  });
});
