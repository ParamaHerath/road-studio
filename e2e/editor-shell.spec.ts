import { test, expect } from "@playwright/test";

test.describe("Editor Shell E2E Smoke Test", () => {
  test("loads the editor shell with toolbar, sidebar, and canvas", async ({ page }) => {
    await page.goto("/");

    // Verify application brand
    await expect(page.getByText("Road Studio")).toBeVisible();
    await expect(page.getByText("KML Network Editor")).toBeVisible();

    // Verify main toolbar buttons
    await expect(page.getByText("Import KML")).toBeVisible();
    await expect(page.getByText("Export KML")).toBeVisible();
    await expect(page.getByText("New Project")).toBeVisible();

    // Verify sidebar empty state initially
    await expect(page.getByTestId("left-sidebar")).toBeVisible();
    await expect(page.getByText("No Road Segments")).toBeVisible();

    // Verify main canvas and active tool indicator
    await expect(page.getByTestId("main-canvas")).toBeVisible();
    await expect(page.getByText("Road Studio Canvas Ready")).toBeVisible();
  });
});
