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
import { SelectedFeatureDetail } from "@/components/layout/PropertiesPanel";

export default function Home() {
  const {
    features,
    setFeatures,
    importSummary,
    setImportSummary,
    importModalOpen,
    setImportModalOpen,
    exportModalOpen,
    setExportModalOpen,
    combineModalOpen,
    setCombineModalOpen,
    joinModalOpen,
    setJoinModalOpen,
    snapModalOpen,
    setSnapModalOpen,
    newProjectModalOpen,
    setNewProjectModalOpen,
    selectedFeatureIds,
    toggleSelectFeature,
    toggleFeatureVisibility,
    renameFeature,
    combineSelectedFeatures,
    joinSelectedFeatures,
    snapSelectedFeatures,
    restoreSession,
    setStorageStatus,
    saveCurrentKml,
    setCurrentFileName,
    setFileHandle,
    undo,
    redo,
    past,
    future,
    resetProject,
    backgroundMode,
    focusedFeatureId,
    setFocusedFeatureId,
  } = useEditorStore();

  const isInitialLoadRef = React.useRef(true);

  // Restore saved session from IndexedDB on initial mount
  React.useEffect(() => {
    loadProjectSession().then((session) => {
      if (session && session.features && session.features.length > 0) {
        restoreSession(
          session.features,
          session.selectedFeatureIds || [],
          session.importSummary || null
        );
      }
      isInitialLoadRef.current = false;
    });
  }, [restoreSession]);

  const selectedFeatureIdsRef = React.useRef(selectedFeatureIds);
  selectedFeatureIdsRef.current = selectedFeatureIds;

  // Debounced auto-save to IndexedDB whenever features change (not on every single selection click)
  React.useEffect(() => {
    if (isInitialLoadRef.current) return;
    if (features.length === 0) return;

    setStorageStatus("saving");
    const timer = setTimeout(() => {
      saveProjectSession(features, selectedFeatureIdsRef.current, importSummary).then(() => {
        setStorageStatus("saved");
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [features, importSummary, setStorageStatus]);

  // Keyboard shortcuts for Undo, Redo, and Save
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
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

  const selectedFeatures = React.useMemo(() => {
    return features.filter((f) => selectedFeatureIds.has(f.id));
  }, [features, selectedFeatureIds]);

  const selectedDetail: SelectedFeatureDetail | null = React.useMemo(() => {
    if (selectedFeatureIds.size !== 1) return null;
    const selectedId = Array.from(selectedFeatureIds)[0];
    const feat = features.find((f) => f.id === selectedId);
    if (!feat) return null;
    return {
      id: feat.id,
      name: feat.name,
      type: feat.geometry.type,
      componentCount: feat.metadata.componentCount,
      coordinateCount: feat.metadata.coordinateCount,
      description: feat.description,
      lengthKm: feat.metadata.lengthMeters / 1000,
    };
  }, [features, selectedFeatureIds]);

  return (
    <>
      <EditorShell
        features={sidebarFeatures}
        selectedDetail={selectedDetail}
        onImportClick={() => setImportModalOpen(true)}
        onSaveClick={saveCurrentKml}
        onExportClick={() => setExportModalOpen(true)}
        onNewProjectClick={() => {
          if (features.length > 0) {
            setNewProjectModalOpen(true);
          } else {
            resetProject();
          }
        }}
        onToggleVisibility={toggleFeatureVisibility}
        onRenameFeature={renameFeature}
        onLocateFeature={(id) => setFocusedFeatureId(id)}
        onCombineSelected={() => setCombineModalOpen(true)}
        onJoinSelected={() => setJoinModalOpen(true)}
        onSnapSelected={() => setSnapModalOpen(true)}
        onUndoClick={undo}
        onRedoClick={redo}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
      >
        <MapCanvas
          features={features}
          selectedFeatureIds={selectedFeatureIds}
          backgroundMode={backgroundMode}
          focusedFeatureId={focusedFeatureId}
          onSelectFeature={toggleSelectFeature}
        />
      </EditorShell>

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={(result) => {
          setFeatures(result.features);
          setImportSummary(result.summary);
          if (result.summary.filename) {
            setCurrentFileName(result.summary.filename);
          }
          if (result.fileHandle) {
            setFileHandle(result.fileHandle);
          }
        }}
      />

      <ExportModal
        isOpen={exportModalOpen}
        features={features}
        selectedFeatureIds={selectedFeatureIds}
        onClose={() => setExportModalOpen(false)}
      />

      <CombineModal
        isOpen={combineModalOpen}
        selectedFeatures={selectedFeatures}
        allFeatures={features}
        onClose={() => setCombineModalOpen(false)}
        onConfirmCombine={(name) => {
          combineSelectedFeatures(name);
        }}
      />

      <JoinModal
        isOpen={joinModalOpen}
        selectedFeatures={selectedFeatures}
        allFeatures={features}
        onClose={() => setJoinModalOpen(false)}
        onConfirmJoin={(candidate, name) => {
          joinSelectedFeatures(candidate, name);
        }}
      />

      <SnapModal
        isOpen={snapModalOpen}
        selectedFeatures={selectedFeatures}
        onClose={() => setSnapModalOpen(false)}
        onConfirmSnap={(candidate, mode) => {
          snapSelectedFeatures(candidate, mode);
        }}
      />

      <NewProjectModal
        isOpen={newProjectModalOpen}
        features={features}
        onClose={() => setNewProjectModalOpen(false)}
        onConfirmReset={resetProject}
      />
    </>
  );
}
