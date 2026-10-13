import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { LeftSidebar, FeatureListItem } from "./LeftSidebar";
import { useEditorStore } from "@/store/editorStore";

describe("LeftSidebar", () => {
  beforeEach(() => {
    useEditorStore.setState({
      sidebarOpen: true,
      searchQuery: "",
      selectedFeatureIds: new Set(),
    });
  });

  const mockFeatures: FeatureListItem[] = [
    {
      id: "f-1",
      name: "A1 Colombo-Kandy Road",
      type: "LineString",
      componentCount: 1,
      coordinateCount: 50,
      visible: true,
    },
    {
      id: "f-2",
      name: "A2 Galle Coastal Road",
      type: "LineString",
      componentCount: 1,
      coordinateCount: 40,
      visible: true,
    },
    {
      id: "f-3",
      name: "A3 Negombo Road",
      type: "LineString",
      componentCount: 1,
      coordinateCount: 30,
      visible: false,
    },
  ];

  it("filters features based on search query", () => {
    render(<LeftSidebar features={mockFeatures} />);
    expect(screen.getByText("A1 Colombo-Kandy Road")).toBeInTheDocument();
    expect(screen.getByText("A2 Galle Coastal Road")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/filter by name/i);
    fireEvent.change(searchInput, { target: { value: "Kandy" } });

    expect(screen.getByText("A1 Colombo-Kandy Road")).toBeInTheDocument();
    expect(screen.queryByText("A2 Galle Coastal Road")).not.toBeInTheDocument();
  });

  it("calls onToggleVisibility when visibility toggle button is clicked", () => {
    const handleToggle = vi.fn();
    render(<LeftSidebar features={mockFeatures} onToggleVisibility={handleToggle} />);

    const hideButtons = screen.getAllByTitle(/hide feature|show feature/i);
    fireEvent.click(hideButtons[0]);

    expect(handleToggle).toHaveBeenCalledWith("f-1");
  });

  it("calls onLocateFeature when map pin is clicked", () => {
    const handleLocate = vi.fn();
    render(<LeftSidebar features={mockFeatures} onLocateFeature={handleLocate} />);

    const locateButtons = screen.getAllByTitle("Focus on map");
    fireEvent.click(locateButtons[0]);

    expect(handleLocate).toHaveBeenCalledWith("f-1");
  });

  it("supports Select All and Deselect All", () => {
    render(<LeftSidebar features={mockFeatures} />);

    const selectAllBtn = screen.getByText("Select All");
    fireEvent.click(selectAllBtn);

    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(3);
    expect(screen.getByText("Deselect All")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Deselect All"));
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(0);
  });

  it("virtualizes list to avoid DOM node explosion when thousands of features exist", () => {
    const largeFeatureList: FeatureListItem[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `feat-${i}`,
      name: `Road Segment #${i}`,
      type: "LineString",
      componentCount: 1,
      coordinateCount: 20,
      visible: true,
    }));

    render(<LeftSidebar features={largeFeatureList} />);

    // First item is rendered in the initial viewport
    expect(screen.getByText("Road Segment #0")).toBeInTheDocument();
    // Far-away item is NOT rendered in the DOM
    expect(screen.queryByText("Road Segment #999")).not.toBeInTheDocument();

    // Checkbox count is bounded by virtualization window (much less than 1000)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeLessThan(50);
  });
});
