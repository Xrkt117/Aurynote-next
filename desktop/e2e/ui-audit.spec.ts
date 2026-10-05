import { test } from "@playwright/test";

const screens = [
  "Your studio",
  "Ear training",
  "Staff reading",
  "Scales & chords",
  "Play it back",
  "Your progress",
];

for (const [width, height] of [
  [1320, 1000],
  [420, 850],
]) {
  test(`ui audit screenshots ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `artifacts/audit/${width}-0-first-load.png`, fullPage: true });
    let i = 1;
    for (const name of screens) {
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name, exact: true })
        .click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `artifacts/audit/${width}-${i++}-${name.replace(/\W+/g, "-").toLowerCase()}.png`,
        fullPage: true,
      });
    }
  });
}
