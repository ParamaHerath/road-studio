"use client";

import * as React from "react";
import { Layers, AlertTriangle, X, Check, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RoadFeature } from "@/types/road";

interface CombineModalProps {
  isOpen: boolean;
  selectedFeatures: RoadFeature[];
  allFeatures: RoadFeature[];
  onClose: () => void;
  onConfirmCombine: (name: string) => void;
}

function computeDefaultRoadName(selectedFeatures: RoadFeature[]): string {
  if (selectedFeatures.length === 0) return "A1";
  const firstName = selectedFeatures[0].name.trim();
  const match = firstName.match(/^([A-Z]\d+)/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return firstName || "A1";
}

export function CombineModal({
  isOpen,
  selectedFeatures,
  allFeatures,
  onClose,
  onConfirmCombine,
}: CombineModalProps) {
  const defaultName = React.useMemo(
    () => computeDefaultRoadName(selectedFeatures),
    [selectedFeatures]
  );
  const [userRoadName, setUserRoadName] = React.useState<string | null>(null);
  const roadName = userRoadName !== null ? userRoadName : defaultName;

  if (!isOpen || selectedFeatures.length < 2) return null;

  // Check if name is already used by another feature not in selection
  const trimmedName = roadName.trim();
  const selectedIdSet = new Set(selectedFeatures.map((f) => f.id));
  const duplicateNameFeature = allFeatures.find(
    (f) => !selectedIdSet.has(f.id) && f.name.toLowerCase() === trimmedName.toLowerCase()
  );

  const totalVertices = selectedFeatures.reduce(
    (sum, f) => sum + f.metadata.coordinateCount,
    0
  );
  const totalLengthKm = (
    selectedFeatures.reduce((sum, f) => sum + f.metadata.lengthMeters, 0) / 1000
  ).toFixed(1);

  const handleCloseModal = () => {
    setUserRoadName(null);
    onClose();
  };

  const handleConfirm = () => {
    if (trimmedName) {
      setUserRoadName(null);
      onConfirmCombine(trimmedName);
      onClose();
    }
  };

  const suggestions = ["A1", "A2", "A3", "A4", "A7", "A8", "A9"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="combine-modal"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-white" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Combine Road Paths
            </h2>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleCloseModal}
            className="text-zinc-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Informational banner explaining safe combine semantics */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
            <p className="font-medium text-zinc-100">Safe Multipart Combination</p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Preserves all coordinates and sequences. Disconnected pieces remain separate in a
              Multipart KML geometry without drawing artificial connector lines.
            </p>
          </div>

          {/* Road Naming Section */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-300">
              New Highway Designation / Name:
            </label>
            <Input
              value={roadName}
              onChange={(e) => setUserRoadName(e.target.value)}
              placeholder="e.g. A1, A2, Colombo-Kandy Road"
              className="bg-zinc-900 text-sm font-semibold text-zinc-100 border-zinc-800"
              autoFocus
              data-testid="combine-name-input"
            />

            {/* Quick Designation Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-zinc-500 font-medium">Quick chips:</span>
              {suggestions.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setUserRoadName(code)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                    roadName === code
                      ? "bg-white text-black border-white font-semibold"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Duplicate Name Warning */}
            {duplicateNameFeature && (
              <div
                className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300 mt-1"
                data-testid="duplicate-name-warning"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <p className="text-[11px]">
                  Another visible feature is already named &ldquo;{duplicateNameFeature.name}&rdquo;.
                  You can still proceed if multiple roads share this designation.
                </p>
              </div>
            )}
          </div>

          {/* Selected Segments Overview */}
          <Card className="border-zinc-800 bg-black/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs text-zinc-300">
                  Segments Being Combined ({selectedFeatures.length})
                </CardTitle>
                <Badge variant="outline">
                  {totalVertices} vertices • {totalLengthKm} km
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs max-h-36 overflow-y-auto">
              {selectedFeatures.map((feat) => (
                <div
                  key={feat.id}
                  className="flex items-center justify-between py-1 px-2 rounded bg-zinc-900/60 border border-zinc-800/80"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Route className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="font-medium text-zinc-200 truncate">{feat.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {feat.metadata.coordinateCount} pts
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-950/90 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleCloseModal}>
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={!trimmedName}
            className="gap-1.5"
            data-testid="confirm-combine-btn"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Combine into &ldquo;{trimmedName || "..."}&rdquo;</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
