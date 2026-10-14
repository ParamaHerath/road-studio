import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { SnapModal } from "./SnapModal";
import { RoadFeature } from "@/types/road";

describe("SnapModal", () => {
  const featA: RoadFeature = {
    id: "f-a",
    name: "Colombo to Kelaniya",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.8600, 6.9200],
        [79.9200, 6.9600],
      ],
    },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: 2,
      lengthMeters: 5000,
      bbox: [79.8600, 6.9200, 79.9200, 6.9600],
    },
  };

  const featB: RoadFeature = {
    id: "f-b",
    name: "Kelaniya to Kadawatha",
    geometry: {
      type: "LineString",
      coordinates: [
        [79.9201, 6.9600], // ~11m gap from featA end
        [79.9600, 7.0000],
      ],
    },
    visible: true,
    properties: {},
    metadata: {
      componentCount: 1,
      coordinateCount: 2,
      lengthMeters: 5000,
      bbox: [79.9201, 6.9600, 79.9600, 7.0000],
    },
  };

  it("does not render when isOpen is false", () => {
    render(
      <SnapModal
        isOpen={false}
        selectedFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmSnap={() => {}}
      />
    );
    expect(screen.queryByTestId("snap-modal")).not.toBeInTheDocument();
  });

  it("does not render when fewer than 2 features selected", () => {
    render(
      <SnapModal
        isOpen={true}
        selectedFeatures={[featA]}
        onClose={() => {}}
        onConfirmSnap={() => {}}
      />
    );
    expect(screen.queryByTestId("snap-modal")).not.toBeInTheDocument();
  });

  it("renders tolerance configuration and candidate endpoints", () => {
    render(
      <SnapModal
        isOpen={true}
        selectedFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmSnap={() => {}}
      />
    );

    expect(screen.getByTestId("snap-modal")).toBeInTheDocument();
    expect(screen.getByText(/Endpoint Snap & Geometry Validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Snap Tolerance/i)).toBeInTheDocument();
    expect(screen.getByText(/Move B to A/i)).toBeInTheDocument();
  });

  it("calls onConfirmSnap with active candidate and mode when confirmed", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <SnapModal
        isOpen={true}
        selectedFeatures={[featA, featB]}
        onClose={handleClose}
        onConfirmSnap={handleConfirm}
      />
    );

    const applyButton = screen.getByRole("button", { name: /Apply Snap/i });
    expect(applyButton).not.toBeDisabled();
    fireEvent.click(applyButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    const [candidate, mode] = handleConfirm.mock.calls[0];
    expect(candidate).toBeDefined();
    expect(mode).toBe("b_to_a");
  });

  it("allows selecting different snap modes (e.g., Move A to B or Midpoint)", () => {
    const handleConfirm = vi.fn();

    render(
      <SnapModal
        isOpen={true}
        selectedFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmSnap={handleConfirm}
      />
    );

    const midpointButton = screen.getByRole("button", { name: /Snap to Midpoint/i });
    fireEvent.click(midpointButton);

    const applyButton = screen.getByRole("button", { name: /Apply Snap/i });
    fireEvent.click(applyButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    const [, mode] = handleConfirm.mock.calls[0];
    expect(mode).toBe("midpoint");
  });
});
