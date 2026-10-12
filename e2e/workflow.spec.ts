import { test, expect } from "@playwright/test";

const SAMPLE_KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Sri Lanka Road Network Sample</name>
    <Placemark>
      <name>A1 Colombo - Kelaniya</name>
      <LineString>
        <coordinates>
          79.8600,6.9270,0 79.8800,6.9350,0 79.9200,6.9550,0
        </coordinates>
      </LineString>
    </Placemark>
    <Placemark>
      <name>A1 Kelaniya - Kadawatha</name>
      <LineString>
        <coordinates>
          79.9201,6.9550,0 79.9400,6.9700,0 79.9600,7.0000,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

test.describe("Road Studio Full Editing Workflow", () => {
  test("imports KML, manages selection, inspects combine/join/snap modals, and triggers export", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Initial State
    await expect(page.getByText("Road Studio")).toBeVisible();
    await expect(page.getByText("No Road Segments")).toBeVisible();

    // 2. Open Import Modal & Paste KML
    await page.getByRole("button", { name: /Import KML/i }).first().click();
    await expect(page.getByTestId("import-modal")).toBeVisible();

    // Paste KML into textarea
    const textarea = page.getByPlaceholder(/paste raw kml/i);
    await textarea.fill(SAMPLE_KML);

    // Verify parser summary card updates dynamically
    await expect(page.getByText(/2 linear features/i)).toBeVisible();

    // Confirm Import
    await page.getByRole("button", { name: /Import 2 Features/i }).click();
    await expect(page.getByTestId("import-modal")).not.toBeVisible();

    // 3. Verify Imported Features in Sidebar
    await expect(page.getByText("A1 Colombo - Kelaniya")).toBeVisible();
    await expect(page.getByText("A1 Kelaniya - Kadawatha")).toBeVisible();

    // 4. Select both features via sidebar
    const item1 = page.getByText("A1 Colombo - Kelaniya");
    const item2 = page.getByText("A1 Kelaniya - Kadawatha");
    await item1.click();
    await item2.click();

    // 5. Contextual Action Bar appears with 2 selected
    const actionBar = page.getByTestId("contextual-action-bar");
    await expect(actionBar).toBeVisible();
    await expect(page.getByText("2 Selected")).toBeVisible();

    // 6. Test Combine Modal
    await page.getByRole("button", { name: /Combine Paths/i }).click();
    await expect(page.getByTestId("combine-modal")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByTestId("combine-modal")).not.toBeVisible();

    // 7. Test Join Modal
    await page.getByRole("button", { name: /Join Endpoints/i }).click();
    await expect(page.getByTestId("join-modal")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByTestId("join-modal")).not.toBeVisible();

    // 8. Test Snap Modal
    await page.getByRole("button", { name: /Snap/i }).click();
    await expect(page.getByTestId("snap-modal")).toBeVisible();
    await expect(page.getByText(/Snap Tolerance/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByTestId("snap-modal")).not.toBeVisible();

    // 9. Test Export Modal
    await page.getByRole("button", { name: /Export KML/i }).click();
    await expect(page.getByTestId("export-modal")).toBeVisible();
    await expect(page.getByText(/Export Scope/i)).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByTestId("export-modal")).not.toBeVisible();

    // 10. Test Destructive New Project Confirmation
    await page.getByRole("button", { name: /New Project/i }).click();
    await expect(page.getByTestId("new-project-modal")).toBeVisible();
    await expect(page.getByText(/Start New Project\?/i)).toBeVisible();
    await expect(page.getByText(/2 roads/i)).toBeVisible();

    // Cancel preserves workspace
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByTestId("new-project-modal")).not.toBeVisible();
    await expect(page.getByText("A1 Colombo - Kelaniya")).toBeVisible();
  });
});
