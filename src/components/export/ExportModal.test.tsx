import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { ExportModal } from "./ExportModal";
import { RoadFeature } from "@/types/road";
import * as serializer from "@/lib/kml/serializer";

vi.mock("@/lib/kml/serializer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/kml/serializer")>();
  return {
    ...actual,
    downloadKmlFile: vi.fn(),
  };
});

describe("ExportModal", () => {
  const sampleFeatures: RoadFeature[] = [
    {
      id: "f1",
      name: "A1 Route",
      visible: true,
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [79.86, 6.92],
          [79.92, 6.96],
        ],
      },
      metadata: {
        componentCount: 1,
        coordinateCount: 2,
        lengthMeters: 5000,
        bbox: [79.86, 6.92, 79.92, 6.96],
      },
    },
    {
      id: "f2",
      name: "A2 Route",
      visible: false,
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [79.85, 6.90],
          [79.87, 6.85],
        ],
      },
      metadata: {
        componentCount: 1,
        coordinateCount: 2,
        lengthMeters: 4000,
        bbox: [79.85, 6.85, 79.87, 6.90],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ExportModal
        isOpen={false}
        features={sampleFeatures}
        selectedFeatureIds={new Set(["f1"])}
        onClose={() => {}}
      />
    );
    expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument();
  });

  it("renders export modal with scope options and feature summary", () => {
    render(
      <ExportModal
        isOpen={true}
        features={sampleFeatures}
        selectedFeatureIds={new Set(["f1"])}
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId("export-modal")).toBeInTheDocument();
    expect(screen.getByText(/Export KML Road Network/i)).toBeInTheDocument();
    expect(screen.getByText(/All Roads/i)).toBeInTheDocument();
    expect(screen.getByText(/Selected/i)).toBeInTheDocument();
    expect(screen.getByText(/Visible/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("road-network-export.kml")).toBeInTheDocument();
  });

  it("triggers download with selected features when scope is set to selected", () => {
    const handleClose = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        features={sampleFeatures}
        selectedFeatureIds={new Set(["f1"])}
        onClose={handleClose}
      />
    );

    // Switch to selected scope
    const selectedScopeButton = screen.getByRole("button", { name: /Selected/i });
    fireEvent.click(selectedScopeButton);

    const downloadButton = screen.getByRole("button", { name: /Download KML/i });
    fireEvent.click(downloadButton);

    expect(serializer.downloadKmlFile).toHaveBeenCalledTimes(1);
    const [kmlString, filename] = vi.mocked(serializer.downloadKmlFile).mock.calls[0];
    expect(filename).toBe("road-network-export.kml");
    expect(kmlString).toContain("A1 Route");
    expect(kmlString).not.toContain("A2 Route"); // A2 is not selected
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when cancel button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <ExportModal
        isOpen={true}
        features={sampleFeatures}
        selectedFeatureIds={new Set()}
        onClose={handleClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
