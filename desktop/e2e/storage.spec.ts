import { test, expect } from "@playwright/test";

test("continued development leaves the submitted site's saved profile untouched", async ({ page }) => {
  const submitted = JSON.stringify({ version: 2, level: 4, volume: 0.8 });
  await page.addInitScript((profile) => {
    localStorage.setItem("aurynote.studio.v1", profile);
  }, submitted);
  await page.goto("/");
  await page.getByLabel("Instrument key", { exact: true }).selectOption("tenor");
  const stored = await page.evaluate(() => ({
    submitted: localStorage.getItem("aurynote.studio.v1"),
    next: JSON.parse(localStorage.getItem("aurynote.next.v1")!),
  }));
  expect(stored.submitted).toBe(submitted);
  expect(stored.next.tuning).toBe("tenor");
  expect(stored.next.level).toBe(0);
});
