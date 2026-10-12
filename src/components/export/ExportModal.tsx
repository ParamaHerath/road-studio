"use client";

import * as React from "react";
import { Download, X, Globe2, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RoadFeature } from "@/types/road";
import {
  serializeRoadFeaturesToKml,
  downloadKmlFile,
} from "@/lib/kml/serializer";

export type ExportScope = "all" | "selected" | "visible";

interface ExportModalProps {
  isOpen: boolean;
  features: RoadFeature[];
  selectedFeatureIds: Set<string>;
  onClose: () => void;
}

export function ExportModal({
  isOpen,
  features,
  selectedFeatureIds,
  onClose,
}: ExportModalProps) {
  const [scope, setScope] = React.useState<ExportScope>("all");
  const [filename, setFilename] = React.useState<string>("road-network-export.kml");
  const [includeExtended, setIncludeExtended] = React.useState<boolean>(true);

  const selectedCount = selectedFeatureIds.size;
  const visibleCount = features.filter((f) => f.visible).length;

  const targetFeatures = React.useMemo(() => {
    if (scope === "selected") {
      return features.filter((f) => selectedFeatureIds.has(f.id));
    }
    if (scope === "visible") {
      return features.filter((f) => f.visible);
    }
    return features;
  }, [features, scope, selectedFeatureIds]);

  const previewMetrics = React.useMemo(() => {
    const totalLines = targetFeatures.reduce(
      (sum, f) => sum + f.metadata.componentCount,
      0
    );
    const totalCoords = targetFeatures.reduce(
      (sum, f) => sum + f.metadata.coordinateCount,
      0
    );
    const totalLengthKm =
      targetFeatures.reduce((sum, f) => sum + f.metadata.lengthMeters, 0) / 1000;

    return {
      featureCount: targetFeatures.length,
      lineComponentCount: totalLines,
      coordinateCount: totalCoords,
      lengthKm: totalLengthKm,
    };
  }, [targetFeatures]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (targetFeatures.length === 0) return;

    const { kmlString } = serializeRoadFeaturesToKml(targetFeatures, {
      projectName: filename.replace(/\.kml$/i, ""),
      includeExtendedData: includeExtended,
    });

    downloadKmlFile(kmlString, filename);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="export-modal"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Export KML Road Network
            </h2>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Export Scope */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300">
              Export Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  scope === "all"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200 font-semibold"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-xs">All Roads</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {features.length} features
                </span>
              </button>

              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={() => setScope("selected")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  scope === "selected"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200 font-semibold"
                    : selectedCount === 0
                    ? "border-slate-800/50 bg-slate-950/20 text-slate-600 cursor-not-allowed"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-xs">Selected</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {selectedCount} features
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope("visible")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                  scope === "visible"
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200 font-semibold"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-xs">Visible</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {visibleCount} features
                </span>
              </button>
            </div>
          </div>

          {/* Filename Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kml-export-filename"
              className="text-xs font-semibold text-slate-300"
            >
              Export Filename
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="kml-export-filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="road-network.kml"
                className="bg-slate-950/60 border-slate-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Extended Metadata checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeExtended}
              onChange={(e) => setIncludeExtended(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 accent-sky-500"
            />
            <span>Include ExtendedData (components, length, coordinates)</span>
          </label>

          {/* Scope Metrics Card */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2">
              <span className="font-semibold flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-sky-400" />
                <span>Export Content Summary</span>
              </span>
              <Badge variant="outline" className="text-[10px] border-slate-700">
                OGC KML 2.2
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex justify-between text-slate-400">
                <span>Placemarks:</span>
                <span className="font-mono text-slate-200">
                  {previewMetrics.featureCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Line Segments:</span>
                <span className="font-mono text-slate-200">
                  {previewMetrics.lineComponentCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Vertices:</span>
                <span className="font-mono text-slate-200">
                  {previewMetrics.coordinateCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Length:</span>
                <span className="font-mono text-slate-200">
                  {previewMetrics.lengthKm.toFixed(1)} km
                </span>
              </div>
            </div>
          </div>

          {/* Google Earth Pro Compatibility Notice */}
          <div className="flex items-start gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-sky-300">
            <Globe2 className="h-4 w-4 shrink-0 text-sky-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Fully verified for Google Earth Pro, QGIS, and ArcGIS. Single roads export as LineString; combined roads export as multipart MultiGeometry preserving separate branches.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-5 py-3 bg-slate-900/90">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExport}
            disabled={targetFeatures.length === 0 || !filename.trim()}
            className="gap-1.5 bg-sky-600 hover:bg-sky-500 text-slate-950 font-semibold"
          >
            <Download className="h-4 w-4 stroke-[2.5]" />
            <span>Download KML</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
