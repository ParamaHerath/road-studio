import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { ImportModal } from "./ImportModal";
import { FIXTURE_CONSECUTIVE_SEGMENTS, FIXTURE_MALFORMED_XML } from "@/lib/kml/fixtures";
import { parseKmlString } from "@/lib/kml/parser";

describe("ImportModal", () => {
  it("does not render when isOpen is false", () => {
    render(<ImportModal isOpen={false} onClose={() => {}} onImportSuccess={() => {}} />);
    expect(screen.queryByTestId("import-modal")).not.toBeInTheDocument();
  });

  it("renders dropzone and file input when isOpen is true", () => {
    render(<ImportModal isOpen={true} onClose={() => {}} onImportSuccess={() => {}} />);
    expect(screen.getByTestId("import-modal")).toBeInTheDocument();
    expect(screen.getByTestId("dropzone")).toBeInTheDocument();
    expect(screen.getByText("Import KML Road Network")).toBeInTheDocument();
  });

  it("displays error message for non-kml files", async () => {
    render(<ImportModal isOpen={true} onClose={() => {}} onImportSuccess={() => {}} />);

    const file = new File(["dummy"], "data.txt", { type: "text/plain" });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toBeInTheDocument();
      expect(screen.getByText(/not a \.kml file/i)).toBeInTheDocument();
    });
  });

  it("displays error for malformed KML content", async () => {
    render(<ImportModal isOpen={true} onClose={() => {}} onImportSuccess={() => {}} />);

    const file = new File([FIXTURE_MALFORMED_XML], "broken.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-error")).toBeInTheDocument();
      expect(screen.getByText(/Malformed KML XML/i)).toBeInTheDocument();
    });
  });

  it("parses valid KML and displays summary with confirm button", async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <ImportModal isOpen={true} onClose={handleClose} onImportSuccess={handleSuccess} />
    );

    const file = new File([FIXTURE_CONSECUTIVE_SEGMENTS], "sri-lanka-a1.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });
    const input = screen.getByTestId("file-input");

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-summary")).toBeInTheDocument();
      expect(screen.getByText("sri-lanka-a1.kml")).toBeInTheDocument();
      expect(screen.getByText("KML file parsed successfully")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId("confirm-import-btn");
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    expect(handleSuccess).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("shows a visible warning when all imported paths are duplicates", async () => {
    const existing = parseKmlString(FIXTURE_CONSECUTIVE_SEGMENTS, "existing.kml").features;

    render(
      <ImportModal
        isOpen={true}
        onClose={() => {}}
        onImportSuccess={() => {}}
        existingFeatures={existing}
      />
    );

    const file = new File([FIXTURE_CONSECUTIVE_SEGMENTS], "sample.kml", {
      type: "application/vnd.google-earth.kml+xml",
    });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.queryByTestId("import-error")).not.toBeInTheDocument();
      expect(screen.getByTestId("import-summary")).toHaveTextContent(/paths exist already/i);
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    });
  });
});
