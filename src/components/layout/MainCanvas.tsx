"use client";

import * as React from "react";
import {
  Layers,
  CornerDownRight,
  MapPin,
  X,
  Compass,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editorStore";

interface MainCanvasProps {
  children?: React.ReactNode;
  selectedCount?: number;
  onCombineSelected?: () => void;
  onJoinSelected?: () => void;
  onSnapSelected?: () => void;
  onClearSelection?: () => void;
}

export function MainCanvas({
  children,
  selectedCount = 0,
  onCombineSelected,
  onJoinSelected,
  onSnapSelected,
  onClearSelection,
}: MainCanvasProps) {
  const { backgroundMode, activeTool } = useEditorStore();

  return (
    <main
      className="relative flex-1 h-[calc(100vh-3rem)] w-full overflow-hidden bg-black"
      data-testid="main-canvas"
    >
      {/* Background layer according to mode */}
      {backgroundMode === "minimal" ? (
        <div className="absolute inset-0 canvas-grid pointer-events-none z-0" />
      ) : backgroundMode === "satellite" ? (
        <div className="absolute top-4 right-4 z-10 max-w-sm rounded-lg border border-amber-500/40 bg-zinc-950/90 p-3 text-xs text-amber-200 shadow-xl backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-100">Satellite Provider Not Configured</p>
              <p className="text-[11px] text-zinc-300 mt-1">
                To respect terms of service and avoid paid API key dependencies, configure a custom imagery tile URL in settings. Falling back to clean grid mode.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Map or Canvas Content */}
      <div className="relative h-full w-full z-0">
        {children ? (
          children
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-zinc-500 select-none">
            <div className="flex flex-col items-center gap-3 max-w-md text-center p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white border border-zinc-800">
                <Compass className="h-6 w-6 stroke-[1.75]" />
              </div>
              <h2 className="text-base font-semibold text-zinc-200">
                Road Studio Canvas Ready
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Import a KML road network to inspect segments, join endpoints, and build continuous fantasy or real-world highway routes.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline" className="text-zinc-400">
                  Mode: {backgroundMode.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-zinc-400">
                  Tool: {activeTool.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Active Tool Indicator (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-md border border-zinc-800 bg-black/90 px-3 py-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Tool:</span>
        <span className="font-semibold text-zinc-200 capitalize">{activeTool}</span>
      </div>

      {/* Floating Contextual Action Bar when 2+ features are selected (Bottom Center) */}
      {selectedCount > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/95 px-4 py-2 text-xs shadow-2xl shadow-black backdrop-blur animate-in fade-in slide-in-from-bottom-2 duration-150"
          data-testid="contextual-action-bar"
        >
          <div className="flex items-center gap-2 pr-2 border-r border-zinc-800">
            <Badge variant="default" className="text-[10px] font-bold">
              {selectedCount} Selected
            </Badge>
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={onCombineSelected}
            className="gap-1.5 text-xs h-7"
            title="Combine selected road segments into one multipart road"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Combine Paths</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onJoinSelected}
            className="gap-1.5 text-xs h-7 border-zinc-800"
            title="Join compatible endpoints"
          >
            <CornerDownRight className="h-3.5 w-3.5 text-emerald-400" />
            <span>Join Endpoints</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onSnapSelected}
            className="gap-1.5 text-xs h-7 border-zinc-800"
            title="Snap nearby endpoints within tolerance"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>Snap</span>
          </Button>

          {onClearSelection && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onClearSelection}
              className="h-7 w-7 text-zinc-400 hover:text-white"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
