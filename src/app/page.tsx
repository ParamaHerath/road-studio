"use client";

import * as React from "react";
import { EditorShell } from "@/components/layout/EditorShell";
import { ImportModal } from "@/components/import/ImportModal";
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
    selectedFeatureIds,
    toggleFeatureVisibility,
    renameFeature,
    resetProject,
  } = useEditorStore();

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
        onNewProjectClick={resetProject}
        onToggleVisibility={toggleFeatureVisibility}
        onRenameFeature={renameFeature}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={(result) => {
          setFeatures(result.features);
          setImportSummary(result.summary);
        }}
      />
    </>
  );
}
