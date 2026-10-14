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
  importDisabled?: boolean;
  onStartOverClick?: () => void;
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

export const EditorShell = React.memo(function EditorShell({
  features = [],
  selectedDetail = null,
  onImportClick,
  importDisabled = false,
  onStartOverClick,
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
  const clearSelection = useEditorStore((state) => state.clearSelection);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-zinc-100 font-sans">
      <TopToolbar
        onImportClick={onImportClick}
        importDisabled={importDisabled}
        onStartOverClick={onStartOverClick}
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
          onCombineSelected={onCombineSelected}
          onJoinSelected={onJoinSelected}
          onSnapSelected={onSnapSelected}
          onClearSelection={clearSelection}
        >
          {children}
        </MainCanvas>
        <PropertiesPanel
          selectedDetail={selectedDetail}
          onRenameFeature={onRenameFeature}
          onCombineSelected={onCombineSelected}
          onJoinSelected={onJoinSelected}
          onSnapSelected={onSnapSelected}
        />
      </div>
    </div>
  );
});
