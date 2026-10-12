import { create } from "zustand";

export type TileBackgroundMode = "osm" | "satellite" | "minimal";

export interface EditorUiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  backgroundMode: TileBackgroundMode;
  searchQuery: string;
  selectedFeatureIds: Set<string>;
  activeTool: "select" | "combine" | "join" | "snap";
  
  // Actions
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setBackgroundMode: (mode: TileBackgroundMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFeatureIds: (ids: Set<string>) => void;
  toggleSelectFeature: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: "select" | "combine" | "join" | "snap") => void;
}

export const useEditorStore = create<EditorUiState>((set) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  backgroundMode: "osm",
  searchQuery: "",
  selectedFeatureIds: new Set(),
  activeTool: "select",

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  setBackgroundMode: (mode) => set({ backgroundMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFeatureIds: (ids) => set({ selectedFeatureIds: ids }),
  toggleSelectFeature: (id) =>
    set((state) => {
      const next = new Set(state.selectedFeatureIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedFeatureIds: next };
    }),
  clearSelection: () => set({ selectedFeatureIds: new Set() }),
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
