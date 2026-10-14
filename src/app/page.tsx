"use client";

import * as React from "react";
import { EditorShell } from "@/components/layout/EditorShell";
import { ImportModal } from "@/components/import/ImportModal";
import { CombineModal } from "@/components/combine/CombineModal";
import { JoinModal } from "@/components/join/JoinModal";
import { SnapModal } from "@/components/snap/SnapModal";
import { ExportModal } from "@/components/export/ExportModal";
import { NewProjectModal } from "@/components/project/NewProjectModal";
import { MapCanvas } from "@/components/map/MapCanvas";
import { useEditorStore } from "@/store/editorStore";
import { loadProjectSession, saveProjectSession } from "@/lib/db/projectDb";
import { FeatureListItem } from "@/components/layout/LeftSidebar";
import type { ImportResult } from "@/types/road";
import { createFilteredImportResult } from "@/lib/kml/import";

// Isolated Map canvas container: selection updates re-render only the map vector styles, not the parent page
const ConnectedMapCanvas = React.memo(function ConnectedMapCanvas() {
  const features = useEditorStore((state) => state.features);
  const selectedFeatureIds = useEditorStore((state) => state.selectedFeatureIds);
  const backgroundMode = useEditorStore((state) => state.backgroundMode);
  const focusedFeatureId = useEditorStore((state) => state.focusedFeatureId);
  const toggleSelectFeature = useEditorStore((state) => state.toggleSelectFeature);

  return (
    <MapCanvas
      features={features}
      selectedFeatureIds={selectedFeatureIds}
      backgroundMode={backgroundMode}
      focusedFeatureId={focusedFeatureId}
      onSelectFeature={toggleSelectFeature}
    />
  );
});

// Isolated modal dialogs container: subscribes to selection state only when a selection-dependent modal is open
const EditorModals = React.memo(function EditorModals() {
  const features = useEditorStore((state) => state.features);
  const setFeatures = useEditorStore((state) => state.setFeatures);
  const recordImportedFeatures = useEditorStore((state) => state.recordImportedFeatures);
  const setImportSummary = useEditorStore((state) => state.setImportSummary);
  const setCurrentFileName = useEditorStore((state) => state.setCurrentFileName);
  const setFileHandle = useEditorStore((state) => state.setFileHandle);

  const importModalOpen = useEditorStore((state) => state.importModalOpen);
  const setImportModalOpen = useEditorStore((state) => state.setImportModalOpen);
  const exportModalOpen = useEditorStore((state) => state.exportModalOpen);
  const setExportModalOpen = useEditorStore((state) => state.setExportModalOpen);
  const combineModalOpen = useEditorStore((state) => state.combineModalOpen);
  const setCombineModalOpen = useEditorStore((state) => state.setCombineModalOpen);
  const joinModalOpen = useEditorStore((state) => state.joinModalOpen);
  const setJoinModalOpen = useEditorStore((state) => state.setJoinModalOpen);
  const snapModalOpen = useEditorStore((state) => state.snapModalOpen);
  const setSnapModalOpen = useEditorStore((state) => state.setSnapModalOpen);
  const newProjectModalOpen = useEditorStore((state) => state.newProjectModalOpen);
  const setNewProjectModalOpen = useEditorStore((state) => state.setNewProjectModalOpen);

  const combineSelectedFeatures = useEditorStore((state) => state.combineSelectedFeatures);
  const joinSelectedFeatures = useEditorStore((state) => state.joinSelectedFeatures);
  const snapSelectedFeatures = useEditorStore((state) => state.snapSelectedFeatures);
  const resetProject = useEditorStore((state) => state.resetProject);

  const isSelectionModalOpen =
    exportModalOpen || combineModalOpen || joinModalOpen || snapModalOpen;
  const selectedFeatureIds = useEditorStore((state) =>
    isSelectionModalOpen ? state.selectedFeatureIds : null
  );

  const selectedFeatures = React.useMemo(() => {
    if (!isSelectionModalOpen || !selectedFeatureIds) return [];
    return features.filter((f) => selectedFeatureIds.has(f.id));
  }, [features, selectedFeatureIds, isSelectionModalOpen]);

  const handleImportSuccess = React.useCallback(
    (result: ImportResult) => {
      const currentFeatures = useEditorStore.getState().features;
      const filteredResult = createFilteredImportResult(result, currentFeatures);
      if (!filteredResult.success || filteredResult.features.length === 0) {
        return;
      }

      setFeatures([...currentFeatures, ...filteredResult.features]);
      recordImportedFeatures(filteredResult.features);
      setImportSummary(filteredResult.summary);
      if (filteredResult.summary.filename) {
        setCurrentFileName(filteredResult.summary.filename);
      }
      if (filteredResult.fileHandle) {
        setFileHandle(filteredResult.fileHandle);
      }
    },
    [setFeatures, recordImportedFeatures, setImportSummary, setCurrentFileName, setFileHandle]
  );

  return (
    <>
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        existingFeatures={features}
      />

      <ExportModal
        isOpen={exportModalOpen}
        features={features}
        selectedFeatureIds={selectedFeatureIds ?? new Set()}
        onClose={() => setExportModalOpen(false)}
      />

      <CombineModal
        isOpen={combineModalOpen}
        selectedFeatures={selectedFeatures}
        allFeatures={features}
        onClose={() => setCombineModalOpen(false)}
        onConfirmCombine={combineSelectedFeatures}
      />

      <JoinModal
        isOpen={joinModalOpen}
        selectedFeatures={selectedFeatures}
        allFeatures={features}
        onClose={() => setJoinModalOpen(false)}
        onConfirmJoin={joinSelectedFeatures}
      />

      <SnapModal
        isOpen={snapModalOpen}
        selectedFeatures={selectedFeatures}
        onClose={() => setSnapModalOpen(false)}
        onConfirmSnap={snapSelectedFeatures}
      />

      <NewProjectModal
        isOpen={newProjectModalOpen}
        features={features}
        onClose={() => setNewProjectModalOpen(false)}
        onConfirmReset={resetProject}
      />
    </>
  );
});

export default function Home() {
  const features = useEditorStore((state) => state.features);
  const importSummary = useEditorStore((state) => state.importSummary);
  const restoreSession = useEditorStore((state) => state.restoreSession);
  const startOver = useEditorStore((state) => state.startOver);
  const setStorageStatus = useEditorStore((state) => state.setStorageStatus);
  const saveCurrentKml = useEditorStore((state) => state.saveCurrentKml);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const resetProject = useEditorStore((state) => state.resetProject);
  const toggleFeatureVisibility = useEditorStore((state) => state.toggleFeatureVisibility);
  const renameFeature = useEditorStore((state) => state.renameFeature);
  const setFocusedFeatureId = useEditorStore((state) => state.setFocusedFeatureId);
  const setImportModalOpen = useEditorStore((state) => state.setImportModalOpen);
  const setExportModalOpen = useEditorStore((state) => state.setExportModalOpen);
  const setCombineModalOpen = useEditorStore((state) => state.setCombineModalOpen);
  const setJoinModalOpen = useEditorStore((state) => state.setJoinModalOpen);
  const setSnapModalOpen = useEditorStore((state) => state.setSnapModalOpen);
  const setNewProjectModalOpen = useEditorStore((state) => state.setNewProjectModalOpen);

  const isInitialLoadRef = React.useRef(true);
  const [sessionReady, setSessionReady] = React.useState(false);

  // Restore saved session from IndexedDB on initial mount
  React.useEffect(() => {
    loadProjectSession()
      .then((session) => {
        if (session && session.features && session.features.length > 0) {
          restoreSession(
            session.features,
            session.selectedFeatureIds || [],
            session.importSummary || null,
            session.initialImportedFeatures
          );
        }
      })
      .catch((error) => {
        console.warn("Failed to restore the saved project session:", error);
      })
      .finally(() => {
        isInitialLoadRef.current = false;
        setSessionReady(true);
      });
  }, [restoreSession]);

  // Debounced auto-save to IndexedDB whenever features change (reads latest selectedFeatureIds from store directly)
  React.useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (features.length === 0) return;

    setStorageStatus("saving");
    const timer = setTimeout(() => {
      void saveProjectSession(
        features,
        useEditorStore.getState().selectedFeatureIds,
        importSummary,
        "Untitled Project",
        useEditorStore.getState().initialImportedFeatures
      )
        .then((saved) => {
          if (saved) setStorageStatus("saved");
        })
        .catch((error) => {
          console.warn("Failed to save the project session:", error);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [features, importSummary, setStorageStatus]);

  // Keyboard shortcuts for Undo, Redo, and Save
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveCurrentKml();
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, saveCurrentKml]);

  const sidebarFeatures: FeatureListItem[] = React.useMemo(() => {
    return features.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.geometry.type,
      componentCount: f.metadata.componentCount,
      coordinateCount: f.metadata.coordinateCount,
      visible: f.visible,
    }));
  }, [features]);

  const handleImportClick = React.useCallback(() => {
    if (sessionReady) setImportModalOpen(true);
  }, [sessionReady, setImportModalOpen]);
  const handleExportClick = React.useCallback(() => setExportModalOpen(true), [setExportModalOpen]);
  const handleNewProjectClick = React.useCallback(() => {
    if (features.length > 0) {
      setNewProjectModalOpen(true);
    } else {
      resetProject();
    }
  }, [features.length, setNewProjectModalOpen, resetProject]);
  const handleLocateFeature = React.useCallback(
    (id: string) => setFocusedFeatureId(id),
    [setFocusedFeatureId]
  );
  const handleCombineSelected = React.useCallback(
    () => setCombineModalOpen(true),
    [setCombineModalOpen]
  );
  const handleJoinSelected = React.useCallback(() => setJoinModalOpen(true), [setJoinModalOpen]);
  const handleSnapSelected = React.useCallback(() => setSnapModalOpen(true), [setSnapModalOpen]);

  return (
    <>
      <EditorShell
        features={sidebarFeatures}
        onImportClick={handleImportClick}
        importDisabled={!sessionReady}
        onStartOverClick={startOver}
        onSaveClick={saveCurrentKml}
        onExportClick={handleExportClick}
        onNewProjectClick={handleNewProjectClick}
        onToggleVisibility={toggleFeatureVisibility}
        onRenameFeature={renameFeature}
        onLocateFeature={handleLocateFeature}
        onCombineSelected={handleCombineSelected}
        onJoinSelected={handleJoinSelected}
        onSnapSelected={handleSnapSelected}
        onUndoClick={undo}
        onRedoClick={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      >
        <ConnectedMapCanvas />
      </EditorShell>

      <EditorModals />
    </>
  );
}
