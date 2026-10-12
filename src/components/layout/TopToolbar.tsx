"use client";

import * as React from "react";
import {
  Route,
  FolderOpen,
  FilePlus,
  Save,
  Undo2,
  Redo2,
  Layers,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore, TileBackgroundMode } from "@/store/editorStore";

interface TopToolbarProps {
  onImportClick?: () => void;
  onSaveClick?: () => void;
  onExportClick?: () => void;
  onNewProjectClick?: () => void;
  onUndoClick?: () => void;
  onRedoClick?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function TopToolbar({
  onImportClick,
  onSaveClick,
  onExportClick,
  onNewProjectClick,
  onUndoClick,
  onRedoClick,
  canUndo = false,
  canRedo = false,
}: TopToolbarProps) {
  const {
    backgroundMode,
    setBackgroundMode,
    storageStatus,
    features,
    currentFileName,
  } = useEditorStore();

  return (
    <header className="flex h-12 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-3 backdrop-blur z-20 select-none">
      {/* Brand & Left toggles */}
      <div className="flex items-center gap-3">

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 shadow-sm">
            <Route className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold tracking-tight text-sm text-slate-100">
              Road Studio
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] py-0 px-1.5 border-slate-700">
              KML Network Editor
            </Badge>
            {storageStatus === "saved" && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Saved locally
              </span>
            )}
            {storageStatus === "saving" && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Saving...
              </span>
            )}
            {storageStatus === "restored" && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-sky-400 font-medium font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Session restored
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Operations */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewProjectClick}
          className="gap-1.5 text-slate-300"
          title="Start fresh project"
        >
          <FilePlus className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden md:inline">New Project</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onImportClick}
          className="gap-1.5 border-slate-700 bg-slate-800/80 text-sky-400 hover:text-sky-300 hover:border-sky-500/50"
          title="Import KML file"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Import KML</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onSaveClick}
          disabled={features.length === 0}
          className="gap-1.5 border-slate-700 bg-slate-800/80 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50"
          title={
            features.length > 0
              ? `Save / Overwrite "${currentFileName}" (Ctrl+S) — ${features.length} segments remaining`
              : "No road segments loaded"
          }
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save KML</span>
          {features.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-0.5 bg-slate-800 text-emerald-300 font-mono">
              {features.length}
            </Badge>
          )}
        </Button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onUndoClick}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRedoClick}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="mx-1 h-4 w-[1px] bg-slate-800" />

        {/* Background Tile Selector */}
        <div className="flex items-center rounded-md border border-slate-800 bg-slate-950/60 p-0.5 text-xs">
          <Layers className="ml-1.5 mr-1 h-3.5 w-3.5 text-slate-400" />
          {(
            [
              { id: "osm", label: "Street" },
              { id: "satellite", label: "Sat" },
              { id: "minimal", label: "Grid" },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setBackgroundMode(mode.id as TileBackgroundMode)}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                backgroundMode === mode.id
                  ? "bg-slate-800 text-sky-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="default"
          size="sm"
          onClick={onExportClick}
          className="gap-1.5"
          title="Export current road network as KML"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export KML</span>
        </Button>
      </div>
    </header>
  );
}
