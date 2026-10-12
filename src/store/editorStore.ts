import { create } from "zustand";
import { RoadFeature, ImportSummary } from "@/types/road";
import { combineFeatures } from "@/lib/geo/combine";
import { joinFeatures, JoinCandidate } from "@/lib/geo/join";
import { applySnap, SnapCandidate, SnapMode } from "@/lib/geo/snap";

export type TileBackgroundMode = "osm" | "satellite" | "minimal";

export interface HistorySnapshot {
  features: RoadFeature[];
  selectedFeatureIds: Set<string>;
}

export interface EditorUiState {
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  backgroundMode: TileBackgroundMode;
  searchQuery: string;
  selectedFeatureIds: Set<string>;
  activeTool: "select" | "combine" | "join" | "snap";
  importModalOpen: boolean;
  exportModalOpen: boolean;
  combineModalOpen: boolean;
  joinModalOpen: boolean;
  snapModalOpen: boolean;
  focusedFeatureId: string | null;

  // Features data
  features: RoadFeature[];
  importSummary: ImportSummary | null;

  // History for undo/redo
  past: HistorySnapshot[];
  future: HistorySnapshot[];

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
  setExportModalOpen: (open: boolean) => void;
  setCombineModalOpen: (open: boolean) => void;
  setJoinModalOpen: (open: boolean) => void;
  setSnapModalOpen: (open: boolean) => void;
  setFocusedFeatureId: (id: string | null) => void;
  setFeatures: (features: RoadFeature[]) => void;
  setImportSummary: (summary: ImportSummary | null) => void;
  toggleFeatureVisibility: (id: string) => void;
  renameFeature: (id: string, newName: string) => void;
  combineSelectedFeatures: (newName: string) => RoadFeature | null;
  joinSelectedFeatures: (candidate: JoinCandidate, newName: string) => RoadFeature | null;
  snapSelectedFeatures: (
    candidate: SnapCandidate,
    mode: SnapMode
  ) => { updatedFeatureA: RoadFeature; updatedFeatureB: RoadFeature } | null;
  undo: () => void;
  redo: () => void;
  resetProject: () => void;
}

export const useEditorStore = create<EditorUiState>((set, get) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  backgroundMode: "osm",
  searchQuery: "",
  selectedFeatureIds: new Set(),
  activeTool: "select",
  importModalOpen: false,
  exportModalOpen: false,
  combineModalOpen: false,
  joinModalOpen: false,
  snapModalOpen: false,
  focusedFeatureId: null,
  features: [],
  importSummary: null,
  past: [],
  future: [],

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
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setCombineModalOpen: (open) => set({ combineModalOpen: open }),
  setJoinModalOpen: (open) => set({ joinModalOpen: open }),
  setSnapModalOpen: (open) => set({ snapModalOpen: open }),
  setFocusedFeatureId: (id) => set({ focusedFeatureId: id }),

  setFeatures: (features) => {
    const current = get();
    const past =
      current.features.length > 0
        ? [...current.past, { features: current.features, selectedFeatureIds: new Set(current.selectedFeatureIds) }]
        : current.past;

    set({
      features,
      past,
      future: [],
    });
  },

  setImportSummary: (summary) => set({ importSummary: summary }),

  toggleFeatureVisibility: (id) =>
    set((state) => ({
      features: state.features.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)),
    })),

  renameFeature: (id, newName) => {
    const current = get();
    const snapshot: HistorySnapshot = {
      features: current.features.map((f) => ({ ...f })),
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    set({
      features: current.features.map((f) => (f.id === id ? { ...f, name: newName } : f)),
      past: [...current.past, snapshot],
      future: [],
    });
  },

  combineSelectedFeatures: (newName: string) => {
    const current = get();
    const toCombine = current.features.filter((f) => current.selectedFeatureIds.has(f.id));
    if (toCombine.length < 2) return null;

    const snapshot: HistorySnapshot = {
      features: current.features.map((f) => ({ ...f })),
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    const combinedFeature = combineFeatures(toCombine, newName);
    const toCombineIdSet = new Set(toCombine.map((f) => f.id));

    const remainingFeatures = current.features.filter((f) => !toCombineIdSet.has(f.id));
    const nextFeatures = [...remainingFeatures, combinedFeature];

    set({
      features: nextFeatures,
      selectedFeatureIds: new Set([combinedFeature.id]),
      past: [...current.past, snapshot],
      future: [],
    });

    return combinedFeature;
  },

  joinSelectedFeatures: (candidate: JoinCandidate, newName: string) => {
    const current = get();
    const toJoin = current.features.filter((f) => current.selectedFeatureIds.has(f.id));
    if (toJoin.length !== 2) return null;

    const snapshot: HistorySnapshot = {
      features: current.features.map((f) => ({ ...f })),
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    const joinedFeature = joinFeatures(toJoin[0], toJoin[1], candidate, newName);
    const toJoinIdSet = new Set(toJoin.map((f) => f.id));

    const remainingFeatures = current.features.filter((f) => !toJoinIdSet.has(f.id));
    const nextFeatures = [...remainingFeatures, joinedFeature];

    set({
      features: nextFeatures,
      selectedFeatureIds: new Set([joinedFeature.id]),
      past: [...current.past, snapshot],
      future: [],
    });

    return joinedFeature;
  },

  snapSelectedFeatures: (candidate: SnapCandidate, mode: SnapMode) => {
    const current = get();
    const toSnap = current.features.filter((f) => current.selectedFeatureIds.has(f.id));
    if (toSnap.length !== 2) return null;

    const featureA = toSnap.find((f) => f.id === candidate.featureAId) || toSnap[0];
    const featureB = toSnap.find((f) => f.id === candidate.featureBId) || toSnap[1];

    const snapshot: HistorySnapshot = {
      features: current.features.map((f) => ({ ...f })),
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    const { updatedFeatureA, updatedFeatureB } = applySnap(featureA, featureB, candidate, mode);

    const nextFeatures = current.features.map((f) => {
      if (f.id === updatedFeatureA.id) return updatedFeatureA;
      if (f.id === updatedFeatureB.id) return updatedFeatureB;
      return f;
    });

    set({
      features: nextFeatures,
      past: [...current.past, snapshot],
      future: [],
    });

    return { updatedFeatureA, updatedFeatureB };
  },

  undo: () => {
    const current = get();
    if (current.past.length === 0) return;

    const previous = current.past[current.past.length - 1];
    const newPast = current.past.slice(0, current.past.length - 1);
    const currentSnapshot: HistorySnapshot = {
      features: current.features,
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    set({
      features: previous.features,
      selectedFeatureIds: new Set(previous.selectedFeatureIds),
      past: newPast,
      future: [currentSnapshot, ...current.future],
    });
  },

  redo: () => {
    const current = get();
    if (current.future.length === 0) return;

    const next = current.future[0];
    const newFuture = current.future.slice(1);
    const currentSnapshot: HistorySnapshot = {
      features: current.features,
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    set({
      features: next.features,
      selectedFeatureIds: new Set(next.selectedFeatureIds),
      past: [...current.past, currentSnapshot],
      future: newFuture,
    });
  },

  resetProject: () =>
    set({
      features: [],
      importSummary: null,
      selectedFeatureIds: new Set(),
      searchQuery: "",
      focusedFeatureId: null,
      past: [],
      future: [],
      combineModalOpen: false,
      joinModalOpen: false,
      snapModalOpen: false,
      exportModalOpen: false,
    }),
}));
