import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { JoinModal } from "./JoinModal";
import { RoadFeature } from "@/types/road";

describe("JoinModal", () => {
  const featA: RoadFeature = {
    id: "f-a",
    name: "Colombo to Kelaniya",
    geometry: { type: "LineString", coordinates: [[79.86, 6.92], [79.92, 6.96]] },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 5000, bbox: [79.86, 6.92, 79.92, 6.96] },
  };

  const featB: RoadFeature = {
    id: "f-b",
    name: "Kelaniya to Kadawatha",
    geometry: { type: "LineString", coordinates: [[79.92, 6.96], [79.96, 7.00]] },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 5000, bbox: [79.92, 6.96, 79.96, 7.00] },
  };

  it("does not render when isOpen is false", () => {
    render(
      <JoinModal
        isOpen={false}
        selectedFeatures={[featA, featB]}
        allFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmJoin={() => {}}
      />
    );
    expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
  });

  it("does not render when fewer than 2 features selected", () => {
    render(
      <JoinModal
        isOpen={true}
        selectedFeatures={[featA]}
        allFeatures={[featA]}
        onClose={() => {}}
        onConfirmJoin={() => {}}
      />
    );
    expect(screen.queryByTestId("join-modal")).not.toBeInTheDocument();
  });

  it("renders candidate endpoints with distance and confirmation controls", () => {
    render(
      <JoinModal
        isOpen={true}
        selectedFeatures={[featA, featB]}
        allFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmJoin={() => {}}
      />
    );

    expect(screen.getByTestId("join-modal")).toBeInTheDocument();
    expect(screen.getByText("Join Compatible Endpoints")).toBeInTheDocument();
    expect(screen.getByText(/0\.0 m/i)).toBeInTheDocument();
  });

  it("allows confirming join with custom road name", () => {
    const handleConfirm = vi.fn();
    render(
      <JoinModal
        isOpen={true}
        selectedFeatures={[featA, featB]}
        allFeatures={[featA, featB]}
        onClose={() => {}}
        onConfirmJoin={handleConfirm}
      />
    );

    const nameInput = screen.getByTestId("join-name-input");
    fireEvent.change(nameInput, { target: { value: "A1 Continuous Highway" } });

    const confirmBtn = screen.getByTestId("confirm-join-btn");
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ gapDistanceMeters: expect.any(Number) }),
      "A1 Continuous Highway"
    );
  });
});
