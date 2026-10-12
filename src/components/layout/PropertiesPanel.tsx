"use client";

import * as React from "react";
import { Info, Edit3, MapPin, Layers, CornerDownRight, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/store/editorStore";

export interface SelectedFeatureDetail {
  id: string;
  name: string;
  type: "LineString" | "MultiLineString";
  componentCount: number;
  coordinateCount: number;
  description?: string;
  lengthKm?: number;
}

interface PropertiesPanelProps {
  selectedDetail?: SelectedFeatureDetail | null;
  selectedCount?: number;
  onRenameFeature?: (id: string, newName: string) => void;
  onCombineSelected?: () => void;
  onJoinSelected?: () => void;
  onSnapSelected?: () => void;
}

export function PropertiesPanel({
  selectedDetail,
  selectedCount = 0,
  onRenameFeature,
  onCombineSelected,
  onJoinSelected,
  onSnapSelected,
}: PropertiesPanelProps) {
  const { propertiesPanelOpen, togglePropertiesPanel } = useEditorStore();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [nameInput, setNameInput] = React.useState("");

  if (!propertiesPanelOpen) return null;

  const isEditing = Boolean(selectedDetail && editingId === selectedDetail.id);

  const handleStartEditing = () => {
    if (selectedDetail) {
      setEditingId(selectedDetail.id);
      setNameInput(selectedDetail.name || "");
    }
  };

  const handleSaveName = () => {
    if (selectedDetail && onRenameFeature && nameInput.trim()) {
      onRenameFeature(selectedDetail.id, nameInput.trim());
      setEditingId(null);
    }
  };

  return (
    <aside
      className="flex w-72 flex-col border-l border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur z-10 shrink-0 h-[calc(100vh-3rem)] p-3 overflow-y-auto"
      data-testid="properties-panel"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Info className="h-3.5 w-3.5 text-sky-400" />
          <span>Properties</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={togglePropertiesPanel}
          className="h-6 w-6 text-slate-400 hover:text-slate-200"
          aria-label="Close properties"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {selectedCount > 1 ? (
          <Card className="border-sky-500/30 bg-sky-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sky-300">Multi-Selection</CardTitle>
                <Badge variant="default">{selectedCount} items</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-400 text-[11px]">
                {selectedCount} segments selected. You can combine them into a single road or join their endpoints.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                {onCombineSelected && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={onCombineSelected}
                    className="w-full text-xs justify-start"
                  >
                    <Layers className="h-3.5 w-3.5 mr-1.5" />
                    Combine into Single Road
                  </Button>
                )}
                {onJoinSelected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onJoinSelected}
                    className="w-full text-xs justify-start border-slate-700"
                  >
                    <CornerDownRight className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
                    Join Endpoints
                  </Button>
                )}
                {onSnapSelected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onSnapSelected}
                    className="w-full text-xs justify-start border-slate-700"
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                    Snap Endpoints
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : selectedDetail ? (
          <div className="flex flex-col gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Feature Name</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <Input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. A1, Kandy Road"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="h-6 text-[11px]"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSaveName}
                        className="h-6 text-[11px]"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <span className="font-semibold text-slate-200 text-sm">
                      {selectedDetail.name || "Unnamed"}
                    </span>
                    {onRenameFeature && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={handleStartEditing}
                        className="h-6 w-6 text-slate-500 hover:text-sky-300"
                        title="Rename road"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Geometry Details</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Type</span>
                  <Badge variant="outline">{selectedDetail.type}</Badge>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Sub-components</span>
                  <span className="font-mono text-slate-300">{selectedDetail.componentCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Coordinates</span>
                  <span className="font-mono text-slate-300">{selectedDetail.coordinateCount}</span>
                </div>
                {selectedDetail.lengthKm !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Approx. Length</span>
                    <span className="font-mono text-slate-300">
                      {selectedDetail.lengthKm.toFixed(2)} km
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Internal ID</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]" title={selectedDetail.id}>
                    {selectedDetail.id}
                  </span>
                </div>
              </CardContent>
            </Card>

            {selectedDetail.description && (
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle>Metadata Description</CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-slate-400 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedDetail.description}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-64">
            <Info className="h-8 w-8 text-slate-700 mb-2 stroke-1" />
            <p className="text-xs font-medium text-slate-400">No Feature Selected</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Click a road on the map or select an item from the sidebar to inspect its properties.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
