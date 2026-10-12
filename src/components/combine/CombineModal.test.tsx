import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { CombineModal } from "./CombineModal";
import { RoadFeature } from "@/types/road";

describe("CombineModal", () => {
  const feat1: RoadFeature = {
    id: "f-1",
    name: "A1 Colombo Segment",
    geometry: { type: "LineString", coordinates: [[79.86, 6.92], [79.88, 6.94]] },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 3000, bbox: [79.86, 6.92, 79.88, 6.94] },
  };

  const feat2: RoadFeature = {
    id: "f-2",
    name: "A1 Kandy Segment",
    geometry: { type: "LineString", coordinates: [[80.60, 7.28], [80.63, 7.30]] },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 4000, bbox: [80.60, 7.28, 80.63, 7.30] },
  };

  const otherFeat: RoadFeature = {
    id: "f-3",
    name: "A2",
    geometry: { type: "LineString", coordinates: [[79.85, 6.90], [79.86, 6.85]] },
    visible: true,
    properties: {},
    metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 5000, bbox: [79.85, 6.85, 79.86, 6.90] },
  };

  it("does not render when isOpen is false", () => {
    render(
      <CombineModal
        isOpen={false}
        selectedFeatures={[feat1, feat2]}
        allFeatures={[feat1, feat2]}
        onClose={() => {}}
        onConfirmCombine={() => {}}
      />
    );
    expect(screen.queryByTestId("combine-modal")).not.toBeInTheDocument();
  });

  it("does not render when fewer than 2 features are selected", () => {
    render(
      <CombineModal
        isOpen={true}
        selectedFeatures={[feat1]}
        allFeatures={[feat1]}
        onClose={() => {}}
        onConfirmCombine={() => {}}
      />
    );
    expect(screen.queryByTestId("combine-modal")).not.toBeInTheDocument();
  });

  it("renders segment overview and prefilled designation", () => {
    render(
      <CombineModal
        isOpen={true}
        selectedFeatures={[feat1, feat2]}
        allFeatures={[feat1, feat2, otherFeat]}
        onClose={() => {}}
        onConfirmCombine={() => {}}
      />
    );
    expect(screen.getByTestId("combine-modal")).toBeInTheDocument();
    expect(screen.getByText("Combine Road Paths")).toBeInTheDocument();
    expect(screen.getByText(/Safe Multipart Combination/i)).toBeInTheDocument();
    expect(screen.getByText("A1 Colombo Segment")).toBeInTheDocument();
    expect(screen.getByText("A1 Kandy Segment")).toBeInTheDocument();
  });

  it("warns when entered name duplicates an existing feature name", () => {
    render(
      <CombineModal
        isOpen={true}
        selectedFeatures={[feat1, feat2]}
        allFeatures={[feat1, feat2, otherFeat]}
        onClose={() => {}}
        onConfirmCombine={() => {}}
      />
    );

    const input = screen.getByTestId("combine-name-input");
    fireEvent.change(input, { target: { value: "A2" } });

    expect(screen.getByTestId("duplicate-name-warning")).toBeInTheDocument();
  });

  it("calls onConfirmCombine with chosen road name", () => {
    const handleConfirm = vi.fn();
    render(
      <CombineModal
        isOpen={true}
        selectedFeatures={[feat1, feat2]}
        allFeatures={[feat1, feat2]}
        onClose={() => {}}
        onConfirmCombine={handleConfirm}
      />
    );

    const input = screen.getByTestId("combine-name-input");
    fireEvent.change(input, { target: { value: "A1 Kandy Highway" } });

    const confirmBtn = screen.getByTestId("confirm-combine-btn");
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledWith("A1 Kandy Highway");
  });
});
