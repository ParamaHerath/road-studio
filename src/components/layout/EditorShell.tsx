"use client";

import * as React from "react";
import { TopToolbar } from "./TopToolbar";
import { LeftSidebar, type FeatureListItem } from "./LeftSidebar";
import { MainCanvas } from "./MainCanvas";
import { PropertiesPanel, type SelectedFeatureDetail } from "./PropertiesPanel";
import { useEditorStore } from "@/store/editorStore";

interface EditorShellProps {
  features?: FeatureListItem[];
  selectedDetail?: SelectedFeatureDetail | null;
  onImportClick?: () => void;
  onSaveClick?: () => void;
  onExportClick?: () => void;
  onNewProjectClick?: () => void;
  onUndoClick?: () => void;
  onRedoClick?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onToggleVisibility?: (id: string) => void;
  onLocateFeature?: (id: string) => void;
  onRenameFeature?: (id: string, newName: string) => void;
  onCombineSelected?: () => void;
  onJoinSelected?: () => void;
  onSnapSelected?: () => void;
  children?: React.ReactNode;
}

export function EditorShell({
  features = [],
  selectedDetail = null,
  onImportClick,
  onSaveClick,
  onExportClick,
  onNewProjectClick,
  onUndoClick,
  onRedoClick,
  canUndo = false,
  canRedo = false,
  onToggleVisibility,
  onLocateFeature,
  onRenameFeature,
  onCombineSelected,
  onJoinSelected,
  onSnapSelected,
  children,
}: EditorShellProps) {
  const { selectedFeatureIds, clearSelection } = useEditorStore();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <TopToolbar
        onImportClick={onImportClick}
        onSaveClick={onSaveClick}
        onExportClick={onExportClick}
        onNewProjectClick={onNewProjectClick}
        onUndoClick={onUndoClick}
        onRedoClick={onRedoClick}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftSidebar
          features={features}
          onToggleVisibility={onToggleVisibility}
          onLocateFeature={onLocateFeature}
        />
        <MainCanvas
          selectedCount={selectedFeatureIds.size}
          onCombineSelected={onCombineSelected}
          onJoinSelected={onJoinSelected}
          onSnapSelected={onSnapSelected}
          onClearSelection={clearSelection}
        >
          {children}
        </MainCanvas>
        <PropertiesPanel
          selectedDetail={selectedDetail}
          selectedCount={selectedFeatureIds.size}
          onRenameFeature={onRenameFeature}
          onCombineSelected={onCombineSelected}
          onJoinSelected={onJoinSelected}
          onSnapSelected={onSnapSelected}
        />
      </div>
    </div>
  );
}
