import { create } from "zustand";
import { RoadFeature, ImportSummary } from "@/types/road";

export type TileBackgroundMode = "osm" | "satellite" | "minimal";

export interface EditorUiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  backgroundMode: TileBackgroundMode;
  searchQuery: string;
  selectedFeatureIds: Set<string>;
  activeTool: "select" | "combine" | "join" | "snap";
  importModalOpen: boolean;
  focusedFeatureId: string | null;

  // Features data
  features: RoadFeature[];
  importSummary: ImportSummary | null;

  // Actions
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setBackgroundMode: (mode: TileBackgroundMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFeatureIds: (ids: Set<string>) => void;
  toggleSelectFeature: (id: string) => void;
  clearSelection: () => void;
  setActiveTool: (tool: "select" | "combine" | "join" | "snap") => void;
  setImportModalOpen: (open: boolean) => void;
  setFocusedFeatureId: (id: string | null) => void;
  setFeatures: (features: RoadFeature[]) => void;
  setImportSummary: (summary: ImportSummary | null) => void;
  toggleFeatureVisibility: (id: string) => void;
  renameFeature: (id: string, newName: string) => void;
  resetProject: () => void;
}

export const useEditorStore = create<EditorUiState>((set) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  backgroundMode: "osm",
  searchQuery: "",
  selectedFeatureIds: new Set(),
  activeTool: "select",
  importModalOpen: false,
  focusedFeatureId: null,
  features: [],
  importSummary: null,

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
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  setFocusedFeatureId: (id) => set({ focusedFeatureId: id }),

  setFeatures: (features) => set({ features }),
  setImportSummary: (summary) => set({ importSummary: summary }),
  toggleFeatureVisibility: (id) =>
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)),
    })),
  renameFeature: (id, newName) =>
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? { ...f, name: newName } : f)),
    })),
  resetProject: () =>
    set({
      features: [],
      importSummary: null,
      selectedFeatureIds: new Set(),
      searchQuery: "",
      focusedFeatureId: null,
    }),
}));
