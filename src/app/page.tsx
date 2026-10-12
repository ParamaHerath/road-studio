"use client";

import * as React from "react";
import { EditorShell } from "@/components/layout/EditorShell";
import { ImportModal } from "@/components/import/ImportModal";
import { CombineModal } from "@/components/combine/CombineModal";
import { JoinModal } from "@/components/join/JoinModal";
import { SnapModal } from "@/components/snap/SnapModal";
import { ExportModal } from "@/components/export/ExportModal";
import { MapCanvas } from "@/components/map/MapCanvas";
import { useEditorStore } from "@/store/editorStore";
import { FeatureListItem } from "@/components/layout/LeftSidebar";
import { SelectedFeatureDetail } from "@/components/layout/PropertiesPanel";

export default function Home() {
  const {
    features,
    setFeatures,
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
    selectedFeatureIds,
    toggleSelectFeature,
    toggleFeatureVisibility,
    renameFeature,
    combineSelectedFeatures,
    joinSelectedFeatures,
    snapSelectedFeatures,
    undo,
    redo,
    past,
    future,
    resetProject,
    backgroundMode,
    focusedFeatureId,
    setFocusedFeatureId,
  } = useEditorStore();

  // Keyboard shortcuts for Undo and Redo
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
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
  }, [undo, redo]);

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
        onExportClick={() => setExportModalOpen(true)}
        onNewProjectClick={resetProject}
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
    </>
  );
}
