import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

describe("editorStore", () => {
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

  it("should have correct initial defaults", () => {
    const state = useEditorStore.getState();
    expect(state.sidebarOpen).toBe(true);
    expect(state.propertiesPanelOpen).toBe(true);
    expect(state.backgroundMode).toBe("osm");
    expect(state.searchQuery).toBe("");
    expect(state.selectedFeatureIds.size).toBe(0);
    expect(state.activeTool).toBe("select");
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
    setBackgroundMode("minimal");
    expect(useEditorStore.getState().backgroundMode).toBe("minimal");
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
});
