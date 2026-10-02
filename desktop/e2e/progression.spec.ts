import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("build, reorder, transpose, save, and export a chord chart", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Scales & chords", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Chord changes", exact: true })
    .click();
  await expect(page.getByText("Your first chord goes here")).toBeVisible();
  await page.getByLabel("Song or chart title").fill("Evening changes");
  await page.getByLabel("Concert root", { exact: true }).selectOption("2");
  await page
    .getByLabel("Chord type", { exact: true })
    .selectOption("Minor seventh");
  await page.getByRole("button", { name: "Add chord", exact: true }).click();
  await page.getByLabel("Concert root", { exact: true }).selectOption("7");
  await page
    .getByLabel("Chord type", { exact: true })
    .selectOption("Dominant seventh");
  await page.getByRole("button", { name: "Add chord", exact: true }).click();
  await page.getByLabel("Concert root", { exact: true }).selectOption("0");
  await page
    .getByLabel("Chord type", { exact: true })
    .selectOption("Major seventh");
  await page.getByRole("button", { name: "Add chord", exact: true }).click();
  const chart = page.getByRole("img", {
    name: "Evening changes: chord changes and notes",
  });
  await expect(chart.locator("desc")).toHaveText(
    "1. Dm7: D, F, A, C. 2. G7: G, B, D, F. 3. CΔ7: C, E, G, B",
  );
  await page
    .getByRole("button", { name: "Move change 3 earlier", exact: true })
    .click();
  await expect(chart.locator("desc")).toContainText("2. CΔ7");
  await page
    .getByRole("button", { name: "Move change 2 later", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove change 3: CΔ7", exact: true })
    .click();
  await expect(chart.locator("[data-chart-cell]")).toHaveCount(2);
  await page.getByRole("button", { name: "Add chord", exact: true }).click();
  await page
    .getByRole("button", { name: "Edit change 3: CΔ7", exact: true })
    .click();
  await page.getByLabel("Chord type", { exact: true }).selectOption("Major");
  await page.getByRole("button", { name: "Save chord", exact: true }).click();
  await expect(chart.locator("desc")).toContainText("3. C: C, E, G");
  await page
    .getByRole("button", { name: "Edit change 3: C", exact: true })
    .click();
  await page
    .getByLabel("Chord type", { exact: true })
    .selectOption("Major seventh");
  await page.getByRole("button", { name: "Save chord", exact: true }).click();
  await page
    .getByLabel("Instrument key", { exact: true })
    .selectOption("tenor");
  await expect(chart).toBeVisible();
  await expect(chart.locator("desc")).toHaveText(
    "1. Em7: E, G, B, D. 2. A7: A, C♯, E, G. 3. DΔ7: D, F♯, A, C♯",
  );
  await page.screenshot({
    path: "artifacts/chord-changes.png",
    fullPage: true,
  });
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save chart as image", exact: true })
    .click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("Evening changes.png");
  await download.saveAs("artifacts/chord-chart.png");
  const png = await readFile("artifacts/chord-chart.png");
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(png.readUInt32BE(16)).toBe(2000);
  expect(png.readUInt32BE(20)).toBe(900);
  await page.reload();
  await page
    .getByRole("button", { name: "Scales & chords", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Chord changes", exact: true })
    .click();
  await expect(page.getByLabel("Song or chart title")).toHaveValue(
    "Evening changes",
  );
  await expect(chart.locator("[data-chart-cell]")).toHaveCount(3);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Pitch notation").selectOption("concert");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(chart.locator("desc")).toContainText("1. Dm7: D, F, A, C");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("aurynote.studio.v1")!).attempts,
    ),
  ).toEqual([]);
});

test("chord playback stops for the tour and the chart scrolls within narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Scales & chords", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Chord changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Try C–Am–F–G", exact: true }).click();
  await page.getByRole("button", { name: "Play changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Stop changes", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quick tour", exact: true }).click();
  await page.getByRole("button", { name: "Skip tour", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play changes", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const chart = page.getByRole("region", { name: "Scrollable chord chart" });
  expect(await chart.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: "artifacts/chord-changes-mobile.png",
    fullPage: true,
  });
});
