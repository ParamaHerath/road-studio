"use client";

import * as React from "react";
import {
  UploadCloud,
  FileCheck2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseKmlString } from "@/lib/kml/parser";
import { createFilteredImportResult } from "@/lib/kml/import";
import { ImportResult, RoadFeature } from "@/types/road";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportResult) => void;
  existingFeatures?: RoadFeature[];
}

export function ImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  existingFeatures = [],
}: ImportModalProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importRequestRef = React.useRef(0);
  const pickerOpenRef = React.useRef(false);

  const resetFileInput = React.useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleCloseModal = () => {
    importRequestRef.current += 1;
    pickerOpenRef.current = false;
    setError(null);
    setImportResult(null);
    setLoading(false);
    setIsDragging(false);
    resetFileInput();
    onClose();
  };

  React.useEffect(() => {
    if (!isOpen) {
      importRequestRef.current += 1;
      resetFileInput();
    }
  }, [isOpen, resetFileInput]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File, fileHandle?: FileSystemFileHandle) => {
    const requestId = ++importRequestRef.current;
    setError(null);
    setImportResult(null);
    resetFileInput();

    if (!file.name.toLowerCase().endsWith(".kml") && !file.name.toLowerCase().endsWith(".xml")) {
      setError(`"${file.name}" is not a .kml file. Please select a valid KML road network file.`);
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (requestId !== importRequestRef.current) return;

      try {
        const result = parseKmlString(text, file.name);
        if (!result.success) {
          setError(result.error || "Failed to parse KML file.");
        } else {
          const filteredResult = createFilteredImportResult({ ...result, fileHandle }, existingFeatures);
          setImportResult(filteredResult);
        }
      } catch (err) {
        setError(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        if (requestId === importRequestRef.current) setLoading(false);
      }
    } catch (err) {
      if (requestId === importRequestRef.current) {
        setLoading(false);
        setError(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };

  const handleBrowseFiles = async () => {
    if (loading || pickerOpenRef.current) return;

    if (
      typeof window !== "undefined" &&
      "showOpenFilePicker" in window &&
      typeof window.showOpenFilePicker === "function"
    ) {
      pickerOpenRef.current = true;
      try {
        const handles = await window.showOpenFilePicker({
          types: [
            {
              description: "KML Road Network Files",
              accept: {
                "application/vnd.google-earth.kml+xml": [".kml"],
                "application/xml": [".xml"],
              },
            },
          ],
        });
        const handle = handles[0];
        if (!handle) return;
        const file = await handle.getFile();
        await handleProcessFile(file, handle);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(`Failed to open file: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        pickerOpenRef.current = false;
      }
      return;
    }
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (importResult && importResult.success) {
      onImportSuccess(importResult);
      handleCloseModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="import-modal"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5 bg-zinc-950/90">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-white" />
            <h2 className="text-sm font-semibold text-zinc-100">Import KML Road Network</h2>
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
          {/* Dropzone */}
          {!importResult && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => void handleBrowseFiles()}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-zinc-400 bg-zinc-900 scale-[0.99]"
                  : "border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-zinc-900/40"
              }`}
              data-testid="dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".kml,.xml"
                onChange={handleFileChange}
                className="hidden"
                data-testid="file-input"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white mb-3 border border-zinc-800">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <UploadCloud className="h-6 w-6 stroke-[1.75]" />
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-200">
                {loading ? "Parsing KML road paths..." : "Click or drag & drop your KML file here"}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                Supports standard `.kml` files containing LineString or MultiLineString road features. Untrusted scripts are stripped.
              </p>
            </div>
          )}

          {/* Parse/read errors only */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              data-testid="import-error"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-rose-200">Import Error: </span>
                {error}
              </div>
            </div>
          )}

          {/* Import Summary Card */}
          {importResult && importResult.success && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150" data-testid="import-summary">
              <div
                className={`flex items-center gap-2 text-xs font-semibold ${
                  importResult.duplicateCount ? "text-amber-300" : "text-emerald-400"
                }`}
              >
                {importResult.duplicateCount ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>
                  {importResult.duplicateCount && importResult.features.length === 0
                    ? "All paths exist already, hence importing is unnecessary."
                    : importResult.duplicateCount
                      ? `${importResult.duplicateCount} path${importResult.duplicateCount === 1 ? "" : "s"} exist${importResult.duplicateCount === 1 ? "s" : ""} already. ${importResult.features.length} new path${importResult.features.length === 1 ? "" : "s"} will be imported.`
                      : "KML file parsed successfully"}
                </span>
              </div>

              <Card className="border-zinc-800 bg-black/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-zinc-300 normal-case text-xs">
                      <FileText className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-mono">{importResult.summary.filename}</span>
                    </CardTitle>
                    <Badge variant="success">Ready</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-zinc-800/80 bg-zinc-900/50 p-2">
                    <span className="text-[11px] text-zinc-500 block">Road Features</span>
                    <span className="font-mono text-base font-semibold text-zinc-200">
                      {importResult.summary.featureCount}
                    </span>
                  </div>
                  <div className="rounded border border-zinc-800/80 bg-zinc-900/50 p-2">
                    <span className="text-[11px] text-zinc-500 block">Line Segments</span>
                    <span className="font-mono text-base font-semibold text-zinc-200">
                      {importResult.summary.lineComponentCount}
                    </span>
                  </div>
                  <div className="rounded border border-zinc-800/80 bg-zinc-900/50 p-2">
                    <span className="text-[11px] text-zinc-500 block">Total Vertices</span>
                    <span className="font-mono text-base font-semibold text-zinc-200">
                      {importResult.summary.coordinateCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded border border-zinc-800/80 bg-zinc-900/50 p-2">
                    <span className="text-[11px] text-zinc-500 block">Approx. Network Length</span>
                    <span className="font-mono text-base font-semibold text-zinc-200">
                      {(importResult.summary.totalLengthMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Warnings for unsupported constructs */}
              {importResult.summary.warnings.length > 0 && !importResult.duplicateCount && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <span className="font-semibold text-amber-200">Import Notes:</span>
                    {importResult.summary.warnings.map((w, idx) => (
                      <p key={idx} className="text-[11px] text-amber-300/90">
                        {w}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 bg-zinc-950/90 px-5 py-3">
          {!(importResult?.success && importResult.features.length === 0) && (
            <Button variant="ghost" size="sm" onClick={handleCloseModal}>
              Cancel
            </Button>
          )}

          {importResult && importResult.success && importResult.features.length > 0 ? (
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmImport}
              className="gap-1.5"
              data-testid="confirm-import-btn"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Load into Project</span>
            </Button>
          ) : importResult?.success && importResult.features.length === 0 ? (
            <Button variant="default" size="sm" onClick={handleCloseModal}>
              Close
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleBrowseFiles()}
              disabled={loading}
              className="gap-1.5 border-zinc-800"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Browse File</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
