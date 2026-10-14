import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveKmlToDisk } from "./save";
import * as serializer from "./serializer";

vi.mock("./serializer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./serializer")>();
  return {
    ...actual,
    downloadKmlFile: vi.fn(),
  };
});

describe("saveKmlToDisk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("overwrites directly when an existing FileSystemFileHandle is present", async () => {
    const writeMock = vi.fn();
    const closeMock = vi.fn();
    const mockHandle = {
      name: "sri-lanka-roads.kml",
      createWritable: vi.fn().mockResolvedValue({
        write: writeMock,
        close: closeMock,
      }),
    } as unknown as FileSystemFileHandle;

    const result = await saveKmlToDisk("<kml></kml>", "sri-lanka-roads.kml", mockHandle);

    expect(result.success).toBe(true);
    expect(result.mode).toBe("direct-overwrite");
    expect(mockHandle.createWritable).toHaveBeenCalledTimes(1);
    expect(writeMock).toHaveBeenCalledWith("<kml></kml>");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to download when FileSystemFileHandle is not supported", async () => {
    // Ensure showSaveFilePicker is not present
    const origPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;

    const result = await saveKmlToDisk("<kml></kml>", "roads.kml", null);

    expect(result.success).toBe(true);
    expect(result.mode).toBe("download");
    expect(serializer.downloadKmlFile).toHaveBeenCalledWith("<kml></kml>", "roads.kml");

    if (origPicker) {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = origPicker;
    }
  });
});
