import { create } from "zustand";
import { RoadFeature, ImportSummary } from "@/types/road";
import { combineFeatures } from "@/lib/geo/combine";
import { joinFeatures, bulkJoinFeatures, JoinCandidate } from "@/lib/geo/join";
import { applySnap, SnapCandidate, SnapMode } from "@/lib/geo/snap";
import { clearProjectSession, saveProjectSession } from "@/lib/db/projectDb";
import { serializeRoadFeaturesToKml } from "@/lib/kml/serializer";
import { saveKmlToDisk, SaveKmlResult } from "@/lib/kml/save";

export type TileBackgroundMode = "osm" | "satellite";
export type StorageStatus = "idle" | "saving" | "saved" | "restored";

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
  newProjectModalOpen: boolean;
  focusedFeatureId: string | null;
  storageStatus: StorageStatus;
  currentFileName: string;
  fileHandle: FileSystemFileHandle | null;
  saveStatusMessage: string | null;

  // Features data
  features: RoadFeature[];
  initialImportedFeatures: RoadFeature[];
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
  setNewProjectModalOpen: (open: boolean) => void;
  setFocusedFeatureId: (id: string | null) => void;
  setStorageStatus: (status: StorageStatus) => void;
  setCurrentFileName: (name: string) => void;
  setFileHandle: (handle: FileSystemFileHandle | null) => void;
  setSaveStatusMessage: (msg: string | null) => void;
  setFeatures: (features: RoadFeature[]) => void;
  recordImportedFeatures: (importedFeatures: RoadFeature[]) => void;
  startOver: () => void;
  setImportSummary: (summary: ImportSummary | null) => void;
  toggleFeatureVisibility: (id: string) => void;
  renameFeature: (id: string, newName: string) => void;
  combineSelectedFeatures: (newName: string) => RoadFeature | null;
  joinSelectedFeatures: (
    candidateOrName: JoinCandidate | string,
    optionalName?: string
  ) => RoadFeature | null;
  snapSelectedFeatures: (
    candidate: SnapCandidate,
    mode: SnapMode
  ) => { updatedFeatureA: RoadFeature; updatedFeatureB: RoadFeature } | null;
  saveCurrentKml: () => Promise<SaveKmlResult>;
  restoreSession: (
    features: RoadFeature[],
    selectedIds: string[],
    summary: ImportSummary | null,
    initialImportedFeatures?: RoadFeature[]
  ) => void;
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
  newProjectModalOpen: false,
  focusedFeatureId: null,
  storageStatus: "idle",
  currentFileName: "road-network.kml",
  fileHandle: null,
  saveStatusMessage: null,
  features: [],
  initialImportedFeatures: [],
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
  setNewProjectModalOpen: (open) => set({ newProjectModalOpen: open }),
  setFocusedFeatureId: (id) => set({ focusedFeatureId: id }),
  setStorageStatus: (status) => set({ storageStatus: status }),
  setCurrentFileName: (name) => set({ currentFileName: name }),
  setFileHandle: (handle) => set({ fileHandle: handle }),
  setSaveStatusMessage: (msg) => set({ saveStatusMessage: msg }),

  saveCurrentKml: async () => {
    const current = get();
    if (current.features.length === 0) {
      return {
        success: false,
        handle: null,
        mode: "download" as const,
        message: "No road segments to save.",
      };
    }

    try {
      const { kmlString } = serializeRoadFeaturesToKml(current.features, {
        projectName: current.currentFileName.replace(/\.kml$/i, ""),
        includeExtendedData: true,
      });

      const result = await saveKmlToDisk(
        kmlString,
        current.currentFileName,
        current.fileHandle
      );

      if (result.success) {
        set({
          storageStatus: "saved",
          saveStatusMessage: `${result.message} (${current.features.length} segments remaining)`,
          fileHandle: result.handle || current.fileHandle,
          currentFileName: result.handle?.name || current.currentFileName,
        });
        try {
          await saveProjectSession(
            current.features,
            current.selectedFeatureIds,
            current.importSummary,
            current.currentFileName.replace(/\.kml$/i, ""),
            current.initialImportedFeatures
          );
        } catch (error) {
          console.warn("Failed to persist the saved KML session:", error);
        }
      } else {
        set({
          saveStatusMessage: result.message,
        });
      }
      return result;
    } catch (error) {
      const message = `Failed to save KML: ${
        error instanceof Error ? error.message : String(error)
      }`;
      set({
        saveStatusMessage: message,
        storageStatus: "idle",
      });
      console.warn(message, error);
      return {
        success: false,
        handle: current.fileHandle,
        mode: "download" as const,
        message,
      };
    }
  },

  restoreSession: (features, selectedIds, summary, initialImportedFeatures) =>
    set({
      features,
      initialImportedFeatures:
        initialImportedFeatures && initialImportedFeatures.length > 0
          ? initialImportedFeatures
          : features.map((f) => ({
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: JSON.parse(JSON.stringify(f.geometry.coordinates)),
              },
              metadata: { ...f.metadata },
            })),
      selectedFeatureIds: new Set(selectedIds),
      importSummary: summary,
      currentFileName: summary?.filename || "road-network.kml",
      past: [],
      future: [],
      storageStatus: "restored",
    }),

  recordImportedFeatures: (importedFeatures) => {
    const cloned = importedFeatures.map((f) => ({
      ...f,
      geometry: {
        ...f.geometry,
        coordinates: JSON.parse(JSON.stringify(f.geometry.coordinates)),
      },
      metadata: { ...f.metadata },
    }));
    set((state) => ({
      initialImportedFeatures: [...state.initialImportedFeatures, ...cloned],
    }));
  },

  startOver: () => {
    const current = get();
    const sourceFeatures =
      current.initialImportedFeatures.length > 0
        ? current.initialImportedFeatures
        : current.features;

    if (sourceFeatures.length === 0) return;

    const resetFeatures = sourceFeatures.map((f) => ({
      ...f,
      visible: true,
      geometry: {
        ...f.geometry,
        coordinates: JSON.parse(JSON.stringify(f.geometry.coordinates)),
      },
      metadata: { ...f.metadata },
    }));

    set({
      features: resetFeatures,
      selectedFeatureIds: new Set(),
      searchQuery: "",
      focusedFeatureId: null,
      past: [],
      future: [],
      storageStatus: "idle",
      saveStatusMessage: "Workspace reset to original imported state",
    });
  },

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
    const nextSummary = current.importSummary
      ? { ...current.importSummary, featureCount: nextFeatures.length }
      : null;

    set({
      features: nextFeatures,
      importSummary: nextSummary,
      selectedFeatureIds: new Set([combinedFeature.id]),
      past: [...current.past, snapshot],
      future: [],
    });

    return combinedFeature;
  },

  joinSelectedFeatures: (
    candidateOrName: JoinCandidate | string,
    optionalName?: string
  ) => {
    const current = get();
    const toJoin = current.features.filter((f) => current.selectedFeatureIds.has(f.id));
    if (toJoin.length < 2) return null;

    const snapshot: HistorySnapshot = {
      features: current.features.map((f) => ({ ...f })),
      selectedFeatureIds: new Set(current.selectedFeatureIds),
    };

    let joinedFeature: RoadFeature;
    const resolvedName =
      typeof candidateOrName === "string"
        ? candidateOrName
        : optionalName || `${toJoin[0].name} (Joined)`;

    if (typeof candidateOrName !== "string" && toJoin.length === 2) {
      joinedFeature = joinFeatures(toJoin[0], toJoin[1], candidateOrName, resolvedName);
    } else {
      joinedFeature = bulkJoinFeatures(toJoin, resolvedName);
    }

    const toJoinIdSet = new Set(toJoin.map((f) => f.id));
    const remainingFeatures = current.features.filter((f) => !toJoinIdSet.has(f.id));
    const nextFeatures = [...remainingFeatures, joinedFeature];
    const nextSummary = current.importSummary
      ? { ...current.importSummary, featureCount: nextFeatures.length }
      : null;

    set({
      features: nextFeatures,
      importSummary: nextSummary,
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

  resetProject: () => {
    clearProjectSession();
    set({
      features: [],
      initialImportedFeatures: [],
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
      newProjectModalOpen: false,
      storageStatus: "idle",
      currentFileName: "road-network.kml",
      fileHandle: null,
      saveStatusMessage: null,
    });
  },
}));
