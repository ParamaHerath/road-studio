import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { EditorShell } from "./EditorShell";
import { useEditorStore } from "@/store/editorStore";

describe("EditorShell", () => {
  beforeEach(() => {
    useEditorStore.setState({
      sidebarOpen: true,
      propertiesPanelOpen: true,
      backgroundMode: "osm",
      searchQuery: "",
      selectedFeatureIds: new Set(),
      activeTool: "select",
    });
  });

  it("renders the top toolbar brand and controls", () => {
    render(<EditorShell />);
    expect(screen.getByText("Road Studio")).toBeInTheDocument();
    expect(screen.getByText("Import KML")).toBeInTheDocument();
    expect(screen.getByText("Start Over")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Export KML")).toBeInTheDocument();
  });

  it("renders empty state in sidebar when no features are provided", () => {
    render(<EditorShell features={[]} />);
    expect(screen.getByText("No Road Segments")).toBeInTheDocument();
  });

  it("renders feature list and allows selection", () => {
    const mockFeatures = [
      {
        id: "feat-1",
        name: "A1 Colombo-Kandy Road",
        type: "LineString" as const,
        componentCount: 1,
        coordinateCount: 120,
        visible: true,
      },
      {
        id: "feat-2",
        name: "A2 Galle Road",
        type: "LineString" as const,
        componentCount: 1,
        coordinateCount: 85,
        visible: true,
      },
    ];

    render(<EditorShell features={mockFeatures} />);
    expect(screen.getByText("A1 Colombo-Kandy Road")).toBeInTheDocument();
    expect(screen.getByText("A2 Galle Road")).toBeInTheDocument();

    // Click first item to select
    fireEvent.click(screen.getByText("A1 Colombo-Kandy Road"));
    expect(useEditorStore.getState().selectedFeatureIds.has("feat-1")).toBe(true);
  });

  it("displays contextual action bar when 2 or more features are selected", () => {
    const mockFeatures = [
      {
        id: "f1",
        name: "Road Part 1",
        type: "LineString" as const,
        componentCount: 1,
        coordinateCount: 10,
        visible: true,
      },
      {
        id: "f2",
        name: "Road Part 2",
        type: "LineString" as const,
        componentCount: 1,
        coordinateCount: 15,
        visible: true,
      },
    ];

    render(<EditorShell features={mockFeatures} />);
    expect(screen.queryByTestId("contextual-action-bar")).not.toBeInTheDocument();

    // Select both
    fireEvent.click(screen.getByText("Road Part 1"));
    fireEvent.click(screen.getByText("Road Part 2"));

    expect(screen.getByTestId("contextual-action-bar")).toBeInTheDocument();
    expect(screen.getByText("Combine Paths")).toBeInTheDocument();
    expect(screen.getByText("Join Endpoints")).toBeInTheDocument();
  });

  it("toggles sidebar visibility", () => {
    render(<EditorShell />);
    expect(screen.getByTestId("left-sidebar")).toBeInTheDocument();

    const toggleBtn = screen.getByLabelText("Toggle sidebar");
    fireEvent.click(toggleBtn);
    expect(screen.queryByTestId("left-sidebar")).not.toBeInTheDocument();
  });
});
