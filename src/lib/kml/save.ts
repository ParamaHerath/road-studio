import { downloadKmlFile } from "./serializer";

export interface SaveKmlResult {
  success: boolean;
  handle: FileSystemFileHandle | null;
  mode: "direct-overwrite" | "save-picker" | "download";
  message: string;
}

/**
 * Saves and overwrites the KML content to disk.
 * Prioritizes:
 * 1. Direct overwrite using an existing FileSystemFileHandle.
 * 2. Overwrite via window.showSaveFilePicker (capturing handle for subsequent saves).
 * 3. Fallback to browser file download under the existing filename.
 */
export async function saveKmlToDisk(
  kmlContent: string,
  fileName: string,
  existingHandle?: FileSystemFileHandle | null
): Promise<SaveKmlResult> {
  const safeName = fileName.endsWith(".kml") ? fileName : `${fileName}.kml`;

  // 1. If we already have a writable FileSystemFileHandle, overwrite directly
  if (existingHandle && typeof existingHandle.createWritable === "function") {
    try {
      const writable = await existingHandle.createWritable();
      await writable.write(kmlContent);
      await writable.close();
      return {
        success: true,
        handle: existingHandle,
        mode: "direct-overwrite",
        message: `Overwrote "${existingHandle.name || safeName}" on disk.`,
      };
    } catch (err) {
      console.warn("Direct overwrite failed, falling back to file picker:", err);
    }
  }

  // 2. Try File System Access API showSaveFilePicker
  if (
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window &&
    typeof window.showSaveFilePicker === "function"
  ) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: safeName,
        types: [
          {
            description: "KML Road Network",
            accept: {
              "application/vnd.google-earth.kml+xml": [".kml"],
              "application/xml": [".xml"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(kmlContent);
      await writable.close();

      return {
        success: true,
        handle,
        mode: "save-picker",
        message: `Saved and linked "${handle.name}". Subsequent saves will overwrite directly.`,
      };
    } catch (err: unknown) {
      // User cancelled the file picker dialog
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          success: false,
          handle: existingHandle || null,
          mode: "save-picker",
          message: "Save cancelled by user.",
        };
      }
      console.warn("showSaveFilePicker failed, falling back to download:", err);
    }
  }

  // 3. Fallback to download
  try {
    downloadKmlFile(kmlContent, safeName);
    return {
      success: true,
      handle: null,
      mode: "download",
      message: `Downloaded "${safeName}" to replace previous file.`,
    };
  } catch (err) {
    return {
      success: false,
      handle: null,
      mode: "download",
      message: `Failed to save KML: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
