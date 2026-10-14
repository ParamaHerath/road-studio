import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";
import { RoadFeature } from "@/types/road";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.setState({
      sidebarOpen: true,
      propertiesPanelOpen: true,
      backgroundMode: "osm",
      searchQuery: "",
      selectedFeatureIds: new Set(),
      activeTool: "select",
      importModalOpen: false,
      features: [],
      importSummary: null,
    });
  });

  it("should have correct initial defaults", () => {
    const state = useEditorStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.propertiesPanelOpen).toBe(true);
    expect(state.backgroundMode).toBe("osm");
    expect(state.searchQuery).toBe("");
    expect(state.selectedFeatureIds.size).toBe(0);
    expect(state.activeTool).toBe("select");
    expect(state.features).toHaveLength(0);
    expect(state.importModalOpen).toBe(false);
  });

  it("should toggle sidebar open/closed", () => {
    const { toggleSidebar } = useEditorStore.getState();
    toggleSidebar();
    expect(useEditorStore.getState().sidebarOpen).toBe(false);
    toggleSidebar();
    expect(useEditorStore.getState().sidebarOpen).toBe(true);
  });

  it("should toggle properties panel open/closed", () => {
    const { togglePropertiesPanel } = useEditorStore.getState();
    togglePropertiesPanel();
    expect(useEditorStore.getState().propertiesPanelOpen).toBe(false);
    togglePropertiesPanel();
    expect(useEditorStore.getState().propertiesPanelOpen).toBe(true);
  });

  it("should update background mode", () => {
    const { setBackgroundMode } = useEditorStore.getState();
    setBackgroundMode("satellite");
    expect(useEditorStore.getState().backgroundMode).toBe("satellite");
  });

  it("should update search query", () => {
    const { setSearchQuery } = useEditorStore.getState();
    setSearchQuery("A1");
    expect(useEditorStore.getState().searchQuery).toBe("A1");
  });

  it("should toggle feature selection", () => {
    const { toggleSelectFeature } = useEditorStore.getState();
    toggleSelectFeature("feat-1");
    expect(useEditorStore.getState().selectedFeatureIds.has("feat-1")).toBe(true);
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(1);

    toggleSelectFeature("feat-2");
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(2);

    toggleSelectFeature("feat-1");
    expect(useEditorStore.getState().selectedFeatureIds.has("feat-1")).toBe(false);
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(1);
  });

  it("should clear all selections", () => {
    const { toggleSelectFeature, clearSelection } = useEditorStore.getState();
    toggleSelectFeature("feat-1");
    toggleSelectFeature("feat-2");
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(2);

    clearSelection();
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(0);
  });

  it("should update and manage features list, rename and visibility", () => {
    const mockFeature: RoadFeature = {
      id: "road-1",
      name: "A1 Colombo-Kandy",
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
        lengthMeters: 5000,
        bbox: [79.86, 6.92, 79.92, 6.96],
      },
    };

    const { setFeatures, toggleFeatureVisibility, renameFeature } = useEditorStore.getState();
    setFeatures([mockFeature]);
    expect(useEditorStore.getState().features).toHaveLength(1);

    toggleFeatureVisibility("road-1");
    expect(useEditorStore.getState().features[0].visible).toBe(false);

    renameFeature("road-1", "A1 Kandy Highway");
    expect(useEditorStore.getState().features[0].name).toBe("A1 Kandy Highway");
  });

  it("should reset project cleanly", () => {
    const { setFeatures, toggleSelectFeature, resetProject } = useEditorStore.getState();
    setFeatures([
      {
        id: "r1",
        name: "Test",
        geometry: { type: "LineString", coordinates: [] },
        visible: true,
        properties: {},
        metadata: { componentCount: 0, coordinateCount: 0, lengthMeters: 0, bbox: [0, 0, 0, 0] },
      },
    ]);
    toggleSelectFeature("r1");
    expect(useEditorStore.getState().features).toHaveLength(1);

    resetProject();
    expect(useEditorStore.getState().features).toHaveLength(0);
    expect(useEditorStore.getState().selectedFeatureIds.size).toBe(0);
  });

  it("should combine selected features and allow undo / redo", () => {
    const f1: RoadFeature = {
      id: "part-1",
      name: "Road Part 1",
      geometry: { type: "LineString", coordinates: [[79.86, 6.92], [79.88, 6.94]] },
      visible: true,
      properties: {},
      metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 3000, bbox: [79.86, 6.92, 79.88, 6.94] },
    };
    const f2: RoadFeature = {
      id: "part-2",
      name: "Road Part 2",
      geometry: { type: "LineString", coordinates: [[79.88, 6.94], [79.92, 6.96]] },
      visible: true,
      properties: {},
      metadata: { componentCount: 1, coordinateCount: 2, lengthMeters: 4000, bbox: [79.88, 6.94, 79.92, 6.96] },
    };

    const { setFeatures, setSelectedFeatureIds, combineSelectedFeatures, undo, redo } =
      useEditorStore.getState();

    setFeatures([f1, f2]);
    setSelectedFeatureIds(new Set(["part-1", "part-2"]));

    const combined = combineSelectedFeatures("A1 Combined");
    expect(combined).not.toBeNull();
    expect(useEditorStore.getState().features).toHaveLength(1);
    expect(useEditorStore.getState().features[0].name).toBe("A1 Combined");
    expect(useEditorStore.getState().features[0].geometry.type).toBe("MultiLineString");
    expect(useEditorStore.getState().selectedFeatureIds.has(combined!.id)).toBe(true);

    // Undo combination
    undo();
    expect(useEditorStore.getState().features).toHaveLength(2);
    expect(useEditorStore.getState().features.map((f) => f.id)).toEqual(["part-1", "part-2"]);
    expect(useEditorStore.getState().selectedFeatureIds.has("part-1")).toBe(true);
    expect(useEditorStore.getState().selectedFeatureIds.has("part-2")).toBe(true);

    // Redo combination
    redo();
    expect(useEditorStore.getState().features).toHaveLength(1);
    expect(useEditorStore.getState().features[0].name).toBe("A1 Combined");
  });

  it("should undo and redo feature rename", () => {
    const f: RoadFeature = {
      id: "road-a",
      name: "Original Name",
      geometry: { type: "LineString", coordinates: [] },
      visible: true,
      properties: {},
      metadata: { componentCount: 0, coordinateCount: 0, lengthMeters: 0, bbox: [0, 0, 0, 0] },
    };

    const { setFeatures, renameFeature, undo, redo } = useEditorStore.getState();
    setFeatures([f]);

    renameFeature("road-a", "New Name");
    expect(useEditorStore.getState().features[0].name).toBe("New Name");

    undo();
    expect(useEditorStore.getState().features[0].name).toBe("Original Name");

    redo();
    expect(useEditorStore.getState().features[0].name).toBe("New Name");
  });
});
