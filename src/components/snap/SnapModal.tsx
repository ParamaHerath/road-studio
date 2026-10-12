"use client";

import * as React from "react";
import {
  MapPin,
  AlertTriangle,
  X,
  Check,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoadFeature } from "@/types/road";
import {
  SnapCandidate,
  SnapMode,
  findSnapCandidates,
} from "@/lib/geo/snap";

interface SnapModalProps {
  isOpen: boolean;
  selectedFeatures: RoadFeature[];
  onClose: () => void;
  onConfirmSnap: (candidate: SnapCandidate, mode: SnapMode) => void;
}

const TOLERANCE_PRESETS = [5, 10, 15, 25, 50];

export function SnapModal({
  isOpen,
  selectedFeatures,
  onClose,
  onConfirmSnap,
}: SnapModalProps) {
  const [toleranceMeters, setToleranceMeters] = React.useState<number>(15);
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<string | null>(null);
  const [snapMode, setSnapMode] = React.useState<SnapMode>("b_to_a");

  const candidates: SnapCandidate[] = React.useMemo(() => {
    if (selectedFeatures.length !== 2) return [];
    return findSnapCandidates(selectedFeatures[0], selectedFeatures[1], toleranceMeters);
  }, [selectedFeatures, toleranceMeters]);

  const activeCandidate = React.useMemo(() => {
    if (candidates.length === 0) return null;
    return candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
  }, [candidates, selectedCandidateId]);

  if (!isOpen || selectedFeatures.length !== 2) return null;

  const handleClose = () => {
    setSelectedCandidateId(null);
    onClose();
  };

  const handleConfirm = () => {
    if (activeCandidate) {
      const val = activeCandidate.validation[snapMode];
      if (val.isValid) {
        onConfirmSnap(activeCandidate, snapMode);
        handleClose();
      }
    }
  };

  const activeValidation = activeCandidate?.validation[snapMode];
  const isValid = Boolean(activeValidation?.isValid);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="snap-modal"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                Endpoint Snap & Geometry Validation
              </h2>
            </div>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Tolerance Configuration */}
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-black/60 p-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="snap-tolerance-input"
                className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
              >
                <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                <span>Snap Tolerance (metres)</span>
              </label>
              <div className="flex items-center gap-1.5">
                {TOLERANCE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setToleranceMeters(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      toleranceMeters === preset
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="snap-tolerance-slider"
                type="range"
                min="1"
                max="100"
                value={toleranceMeters}
                onChange={(e) => setToleranceMeters(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
                aria-label="Snap tolerance range"
              />
              <div className="flex items-center gap-1">
                <Input
                  id="snap-tolerance-input"
                  type="number"
                  min="1"
                  max="100"
                  value={toleranceMeters}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (!isNaN(val) && val > 0 && val <= 100) {
                      setToleranceMeters(val);
                    }
                  }}
                  className="w-16 h-7 text-xs font-mono text-center bg-zinc-900 border-zinc-700"
                />
                <span className="text-xs text-zinc-400 font-mono">m</span>
              </div>
            </div>
          </div>

          {/* Candidate Endpoints */}
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">No Nearby Endpoints Found</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                The endpoints of &quot;{selectedFeatures[0].name}&quot; and &quot;{selectedFeatures[1].name}&quot; are further apart than the maximum search radius.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">
                Endpoint Candidates ({candidates.length})
              </label>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Snap candidate pairs">
                {candidates.map((c) => {
                  const isSelected = activeCandidate?.id === c.id;
                  const isWithin = c.gapDistanceMeters <= toleranceMeters;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidateId(c.id)}
                      className={`flex flex-col gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-amber-500/60 bg-amber-500/10 shadow-sm"
                          : "border-zinc-800 bg-black/40 hover:border-zinc-700"
                      }`}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-200">
                            {c.featureAName} ({c.posA})
                          </span>
                          <ArrowRight className="h-3 w-3 text-zinc-500" />
                          <span className="font-semibold text-zinc-200">
                            {c.featureBName} ({c.posB})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={isWithin ? "default" : "outline"}
                            className={`text-[10px] font-mono ${
                              isWithin
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                          >
                            Gap: {c.gapDistanceMeters.toFixed(1)} m
                          </Badge>
                          {isSelected && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-black">
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Candidate Detailed Settings */}
          {activeCandidate && (
            <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-black/40 p-3.5">
              <label className="text-xs font-semibold text-zinc-300">
                Snap Target Direction
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSnapMode("b_to_a")}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-center transition-all ${
                    snapMode === "b_to_a"
                      ? "border-zinc-500 bg-zinc-800 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-[11px]">Move B to A</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">A fixed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapMode("a_to_b")}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-center transition-all ${
                    snapMode === "a_to_b"
                      ? "border-zinc-500 bg-zinc-800 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-[11px]">Move A to B</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">B fixed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSnapMode("midpoint")}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-center transition-all ${
                    snapMode === "midpoint"
                      ? "border-zinc-500 bg-zinc-800 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-[11px]">Snap to Midpoint</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">Both adjust</span>
                </button>
              </div>

              {/* Endpoint Coordinate Inspection */}
              <div className="flex flex-col gap-1.5 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 p-2.5 rounded border border-zinc-800/80">
                <div className="flex justify-between">
                  <span className="text-zinc-500">{activeCandidate.featureAName} ({activeCandidate.posA}):</span>
                  <span>
                    [{activeCandidate.coordA[0].toFixed(5)}, {activeCandidate.coordA[1].toFixed(5)}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">{activeCandidate.featureBName} ({activeCandidate.posB}):</span>
                  <span>
                    [{activeCandidate.coordB[0].toFixed(5)}, {activeCandidate.coordB[1].toFixed(5)}]
                  </span>
                </div>
                {activeValidation?.snappedCoordA && (
                  <div className="flex justify-between border-t border-zinc-800 pt-1 text-zinc-200">
                    <span className="text-zinc-400">Proposed Snapped Point:</span>
                    <span>
                      [{activeValidation.snappedCoordA[0].toFixed(5)}, {activeValidation.snappedCoordA[1].toFixed(5)}]
                    </span>
                  </div>
                )}
              </div>

              {/* Validation & Warning notices */}
              {activeValidation && (
                <div className="flex flex-col gap-1.5">
                  {/* Errors */}
                  {activeValidation.errors.map((err, i) => (
                    <div
                      key={`err-${i}`}
                      className="flex items-start gap-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300"
                    >
                      <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span>{err}</span>
                    </div>
                  ))}

                  {/* Warnings */}
                  {activeValidation.warnings.map((warn, i) => (
                    <div
                      key={`warn-${i}`}
                      className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200"
                    >
                      <Compass className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}

                  {activeValidation.isValid && activeValidation.warnings.length === 0 && (
                    <div className="flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-300">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Clean geometry: Within tolerance with no alignment distortions.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-5 py-3 bg-zinc-950/90">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={!activeCandidate || !isValid}
            className="gap-1.5"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            <span>Apply Snap</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
