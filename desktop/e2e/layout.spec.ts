import { test, expect } from "@playwright/test";

for (const width of [320, 880, 1320]) {
  test(`all screens stay within a ${width}px window`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    for (const name of [
      "Your studio",
      "Ear training",
      "Staff reading",
      "Scales & chords",
      "Play it back",
      "Your progress",
    ]) {
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("button", { name, exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        name,
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
