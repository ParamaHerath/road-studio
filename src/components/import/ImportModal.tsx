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
import { ImportResult } from "@/types/road";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportResult) => void;
}

export function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<ImportResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCloseModal = () => {
    setError(null);
    setImportResult(null);
    setLoading(false);
    setIsDragging(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleProcessFile = async (file: File, fileHandle?: FileSystemFileHandle) => {
    setError(null);
    setImportResult(null);

    if (!file.name.toLowerCase().endsWith(".kml") && !file.name.toLowerCase().endsWith(".xml")) {
      setError(`"${file.name}" is not a .kml file. Please select a valid KML road network file.`);
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      // Parse in next tick so loading state renders immediately even for large files
      setTimeout(() => {
        const result = parseKmlString(text, file.name);
        setLoading(false);
        if (!result.success) {
          setError(result.error || "Failed to parse KML file.");
        } else {
          setImportResult({ ...result, fileHandle });
        }
      }, 50);
    } catch (err) {
      setLoading(false);
      setError(`Failed to read file: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleBrowseFiles = async () => {
    if (
      typeof window !== "undefined" &&
      "showOpenFilePicker" in window &&
      typeof window.showOpenFilePicker === "function"
    ) {
      try {
        const [handle] = await window.showOpenFilePicker({
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
        const file = await handle.getFile();
        await handleProcessFile(file, handle);
        return;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
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
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      data-testid="import-modal"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-sky-400" />
            <h2 className="text-sm font-semibold text-slate-100">Import KML Road Network</h2>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleCloseModal}
            className="text-slate-400 hover:text-slate-200"
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
              onClick={handleBrowseFiles}
              className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-sky-400 bg-sky-500/10 scale-[0.99]"
                  : "border-slate-700 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-950/60"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 mb-3">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                ) : (
                  <UploadCloud className="h-6 w-6 stroke-[1.75]" />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {loading ? "Parsing KML road paths..." : "Click or drag & drop your KML file here"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Supports standard `.kml` files containing LineString or MultiLineString road features. Untrusted scripts are stripped.
              </p>
            </div>
          )}

          {/* Error Banner */}
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
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>KML file parsed successfully</span>
              </div>

              <Card className="border-slate-800 bg-slate-950/60">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-1.5 text-slate-300 normal-case text-xs">
                      <FileText className="h-3.5 w-3.5 text-sky-400" />
                      <span className="font-mono">{importResult.summary.filename}</span>
                    </CardTitle>
                    <Badge variant="success">Ready</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2">
                    <span className="text-[11px] text-slate-500 block">Road Features</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
                      {importResult.summary.featureCount}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2">
                    <span className="text-[11px] text-slate-500 block">Line Segments</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
                      {importResult.summary.lineComponentCount}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2">
                    <span className="text-[11px] text-slate-500 block">Total Vertices</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
                      {importResult.summary.coordinateCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded border border-slate-800/80 bg-slate-900/50 p-2">
                    <span className="text-[11px] text-slate-500 block">Approx. Network Length</span>
                    <span className="font-mono text-base font-semibold text-slate-200">
                      {(importResult.summary.totalLengthMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Warnings for unsupported constructs */}
              {importResult.summary.warnings.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <span className="font-semibold text-amber-200">Unsupported Constructs Note:</span>
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
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 bg-slate-900/90 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleCloseModal}>
            Cancel
          </Button>

          {importResult && importResult.success ? (
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
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="gap-1.5 border-slate-700"
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
