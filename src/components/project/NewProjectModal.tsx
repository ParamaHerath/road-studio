"use client";

import * as React from "react";
import { AlertTriangle, X, Trash2, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoadFeature } from "@/types/road";

interface NewProjectModalProps {
  isOpen: boolean;
  features: RoadFeature[];
  onClose: () => void;
  onConfirmReset: () => void;
}

export function NewProjectModal({
  isOpen,
  features,
  onClose,
  onConfirmReset,
}: NewProjectModalProps) {
  if (!isOpen) return null;

  const totalLengthKm =
    features.reduce((sum, f) => sum + f.metadata.lengthMeters, 0) / 1000;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="new-project-modal"
    >
      <div className="relative w-full max-w-md rounded-xl border border-red-500/30 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Start New Project?
            </h2>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs text-zinc-300">
          <p className="leading-relaxed">
            Starting a new project will clear all road features in the current workspace and permanently erase the local browser session.
          </p>

          {features.length > 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-black/60 p-3.5 flex flex-col gap-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5 text-zinc-400" />
                <span>Workspace Content to be Cleared</span>
              </span>
              <div className="flex justify-between text-zinc-400 pt-1">
                <span>Features:</span>
                <span className="font-mono text-zinc-200">{features.length} roads</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Total Network Length:</span>
                <span className="font-mono text-zinc-200">
                  {totalLengthKm.toFixed(1)} km
                </span>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 italic">
              Your workspace is currently empty.
            </p>
          )}

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200 text-[11px] leading-relaxed">
            <strong>Warning:</strong> This action cannot be undone. If you have unsaved progress, cancel and export your network to KML first.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3 bg-zinc-950/90">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear &amp; Reset Workspace</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
