"use client";

import * as React from "react";
import { CornerDownRight, AlertTriangle, X, Check, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoadFeature } from "@/types/road";
import { JoinCandidate, findJoinCandidates } from "@/lib/geo/join";

interface JoinModalProps {
  isOpen: boolean;
  selectedFeatures: RoadFeature[];
  allFeatures: RoadFeature[];
  onClose: () => void;
  onConfirmJoin: (candidate: JoinCandidate, name: string) => void;
}

export function JoinModal({
  isOpen,
  selectedFeatures,
  allFeatures,
  onClose,
  onConfirmJoin,
}: JoinModalProps) {
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<string | null>(null);
  const [userRoadName, setUserRoadName] = React.useState<string | null>(null);

  const candidates: JoinCandidate[] = React.useMemo(() => {
    if (selectedFeatures.length !== 2) return [];
    return findJoinCandidates(selectedFeatures[0], selectedFeatures[1], 500);
  }, [selectedFeatures]);

  const activeCandidate = React.useMemo(() => {
    if (candidates.length === 0) return null;
    return (
      candidates.find((c) => c.id === selectedCandidateId) || candidates[0]
    );
  }, [candidates, selectedCandidateId]);

  const defaultName = React.useMemo(() => {
    if (selectedFeatures.length === 0) return "Joined Road";
    const commonMatch = selectedFeatures[0].name.match(/^([A-Z]\d+)/i);
    if (commonMatch) return commonMatch[1].toUpperCase();
    return selectedFeatures[0].name;
  }, [selectedFeatures]);

  const roadName = userRoadName !== null ? userRoadName : defaultName;

  if (!isOpen || selectedFeatures.length !== 2) return null;

  const handleCloseModal = () => {
    setSelectedCandidateId(null);
    setUserRoadName(null);
    onClose();
  };

  const handleConfirm = () => {
    if (activeCandidate && roadName.trim()) {
      onConfirmJoin(activeCandidate, roadName.trim());
      handleCloseModal();
    }
  };

  const selectedIdSet = new Set(selectedFeatures.map((f) => f.id));
  const duplicateNameFeature = allFeatures.find(
    (f) => !selectedIdSet.has(f.id) && f.name.toLowerCase() === roadName.trim().toLowerCase()
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="join-modal"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <CornerDownRight className="h-5 w-5 text-white" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Join Compatible Endpoints
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
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <AlertTriangle className="h-8 w-8 text-amber-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">No Compatible Endpoints Found</p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
                The endpoints of these two roads are further than 500 metres apart. Use &ldquo;Combine&rdquo; to group them safely as a multipart road.
              </p>
            </div>
          ) : (
            <>
              {/* Candidate Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Select Connection Candidate:
                </label>
                <div className="space-y-2">
                  {candidates.map((cand) => {
                    const isSelected = activeCandidate?.id === cand.id;
                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateId(cand.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "border-zinc-500 bg-zinc-900 shadow-sm"
                            : "border-zinc-800 bg-black/40 hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                            <span>{cand.endpointA.position.toUpperCase()} of {selectedFeatures[0].name}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{cand.endpointB.position.toUpperCase()} of {selectedFeatures[1].name}</span>
                          </div>
                          <Badge
                            variant={cand.gapDistanceMeters < 0.1 ? "success" : "default"}
                            className="font-mono text-[10px]"
                          >
                            {cand.gapDistanceMeters < 0.1
                              ? "0.0 m (Coincident)"
                              : `${cand.gapDistanceMeters.toFixed(1)} m gap`}
                          </Badge>
                        </div>

                        {/* Reversal notice */}
                        {(cand.needsReverseA || cand.needsReverseB) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                            <RotateCcw className="h-3 w-3 shrink-0" />
                            <span>
                              {cand.needsReverseA && cand.needsReverseB
                                ? "Both roads will be reversed for alignment"
                                : cand.needsReverseA
                                ? `Road 1 will be reversed`
                                : `Road 2 will be reversed`}
                            </span>
                          </div>
                        )}

                        {/* Ambiguity notice */}
                        {cand.isAmbiguous && (
                          <div className="flex items-start gap-1.5 text-[11px] text-amber-300 pt-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{cand.ambiguityReason}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Road Designation Input */}
              <div className="flex flex-col gap-2 pt-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Joined Road Name:
                </label>
                <Input
                  value={roadName}
                  onChange={(e) => setUserRoadName(e.target.value)}
                  placeholder="e.g. A1 Highway"
                  className="bg-zinc-900 text-sm font-semibold text-zinc-100 border-zinc-800"
                  data-testid="join-name-input"
                />

                {duplicateNameFeature && (
                  <div className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <p className="text-[11px]">
                      Another visible road is named &ldquo;{duplicateNameFeature.name}&rdquo;.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
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
            disabled={!activeCandidate || !roadName.trim()}
            className="gap-1.5"
            data-testid="confirm-join-btn"
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Confirm &amp; Join Endpoints</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
