import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { NewProjectModal } from "./NewProjectModal";
import { RoadFeature } from "@/types/road";

describe("NewProjectModal", () => {
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
  ];

  it("does not render when isOpen is false", () => {
    render(
      <NewProjectModal
        isOpen={false}
        features={sampleFeatures}
        onClose={() => {}}
        onConfirmReset={() => {}}
      />
    );
    expect(screen.queryByTestId("new-project-modal")).not.toBeInTheDocument();
  });

  it("renders warning and feature count when isOpen is true", () => {
    render(
      <NewProjectModal
        isOpen={true}
        features={sampleFeatures}
        onClose={() => {}}
        onConfirmReset={() => {}}
      />
    );

    expect(screen.getByTestId("new-project-modal")).toBeInTheDocument();
    expect(screen.getByText(/Start New Project\?/i)).toBeInTheDocument();
    expect(screen.getByText(/1 roads/i)).toBeInTheDocument();
    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", () => {
    const handleClose = vi.fn();
    render(
      <NewProjectModal
        isOpen={true}
        features={sampleFeatures}
        onClose={handleClose}
        onConfirmReset={() => {}}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirmReset and onClose when Clear & Reset Workspace is clicked", () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <NewProjectModal
        isOpen={true}
        features={sampleFeatures}
        onClose={handleClose}
        onConfirmReset={handleConfirm}
      />
    );

    const resetButton = screen.getByRole("button", { name: /Clear & Reset Workspace/i });
    fireEvent.click(resetButton);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
