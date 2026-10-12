"use client";

import * as React from "react";
import {
  Search,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Layers,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEditorStore } from "@/store/editorStore";

export interface FeatureListItem {
  id: string;
  name: string;
  type: "LineString" | "MultiLineString";
  componentCount: number;
  coordinateCount: number;
  visible: boolean;
}

interface LeftSidebarProps {
  features?: FeatureListItem[];
  onToggleVisibility?: (id: string) => void;
  onLocateFeature?: (id: string) => void;
}

export function LeftSidebar({
  features = [],
  onToggleVisibility,
  onLocateFeature,
}: LeftSidebarProps) {
  const {
    sidebarOpen,
    searchQuery,
    setSearchQuery,
    selectedFeatureIds,
    toggleSelectFeature,
    setSelectedFeatureIds,
    clearSelection,
  } = useEditorStore();

  const filteredFeatures = React.useMemo(() => {
    if (!searchQuery.trim()) return features;
    const q = searchQuery.toLowerCase();
    return features.filter((f) => f.name.toLowerCase().includes(q));
  }, [features, searchQuery]);

  const allSelected =
    filteredFeatures.length > 0 &&
    filteredFeatures.every((f) => selectedFeatureIds.has(f.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      const next = new Set(selectedFeatureIds);
      filteredFeatures.forEach((f) => next.add(f.id));
      setSelectedFeatureIds(next);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <aside
      className="flex w-80 flex-col border-r border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur z-10 shrink-0 h-[calc(100vh-3rem)]"
      data-testid="left-sidebar"
    >
      {/* Sidebar Header & Search */}
      <div className="flex flex-col gap-2 p-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-sky-400" />
            <span>Road Segments</span>
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {features.length}
            </Badge>
          </div>
          {selectedFeatureIds.size > 0 && (
            <Badge variant="default" className="text-[10px]">
              {selectedFeatureIds.size} selected
            </Badge>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Filter by name (e.g. A1, bypass)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs bg-slate-950/60"
          />
        </div>

        {/* Selection helper row */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <button
            onClick={handleToggleSelectAll}
            disabled={filteredFeatures.length === 0}
            className="flex items-center gap-1.5 hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="h-3.5 w-3.5 text-sky-400" />
            ) : (
              <Square className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="text-[11px] font-medium">
              {allSelected ? "Deselect All" : "Select All"}
            </span>
          </button>

          {selectedFeatureIds.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-[11px] text-slate-400 hover:text-sky-300 transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Feature List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-64">
            <Layers className="h-10 w-10 text-slate-700 mb-2 stroke-1" />
            <p className="text-xs font-medium text-slate-300">No Road Segments</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              Import a KML file to view and combine road segments.
            </p>
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No segments match &ldquo;{searchQuery}&rdquo;
          </div>
        ) : (
          filteredFeatures.map((feature) => {
            const isSelected = selectedFeatureIds.has(feature.id);
            return (
              <div
                key={feature.id}
                onClick={() => toggleSelectFeature(feature.id)}
                className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-sky-500/15 border-l-2 border-sky-400 text-slate-100"
                    : "hover:bg-slate-800/50 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // handled by row click
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-0 cursor-pointer"
                  />
                  <div className="truncate">
                    <div className="font-medium text-slate-200 truncate">
                      {feature.name || "Unnamed Road"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{feature.type}</span>
                      <span>•</span>
                      <span>{feature.componentCount} seg</span>
                      <span>•</span>
                      <span>{feature.coordinateCount} pts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onLocateFeature && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateFeature(feature.id);
                      }}
                      title="Focus on map"
                      className="h-6 w-6 text-slate-400 hover:text-sky-300"
                    >
                      <MapPin className="h-3 w-3" />
                    </Button>
                  )}
                  {onToggleVisibility && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(feature.id);
                      }}
                      title={feature.visible ? "Hide feature" : "Show feature"}
                      className="h-6 w-6 text-slate-400 hover:text-sky-300"
                    >
                      {feature.visible ? (
                        <Eye className="h-3 w-3 text-slate-300" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-slate-600" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Items Summary Footer */}
      {selectedFeatureIds.size > 0 && (
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {selectedFeatureIds.size} selected
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="h-6 px-2 text-[11px] text-sky-400 hover:text-sky-300"
          >
            Clear
          </Button>
        </div>
      )}
    </aside>
  );
}
