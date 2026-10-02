import { test, expect, _electron as electron } from "@playwright/test";
import { resolve } from "node:path";
test("production desktop opens offline with isolated renderer", async () => {
  const env = { ...process.env, AURYNOTE_TEST_MODE: "1" };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: ["."], env });
  try {
    const page = await app.firstWindow();
    await expect(
      page.getByRole("heading", { name: "Train your ear" }),
    ).toBeVisible();
    expect(page.url()).toMatch(/^file:/);
    expect(
      await page.evaluate(
        () => typeof (window as unknown as { require?: unknown }).require,
      ),
    ).toBe("undefined");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.screenshot({
      path: "artifacts/desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "Scales & chords", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "C major", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Quick tour", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Chord changes", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Try C–Am–F–G", exact: true })
      .click();
    await app.evaluate(({ session }, savePath) => {
      (globalThis as any).chartDownload = new Promise<string>(resolveDownload => {
        session.defaultSession.once("will-download", (_event, item) => {
          item.setSavePath(savePath);
          item.once("done", (_event, state) => resolveDownload(state));
        });
      });
    }, resolve("artifacts/desktop-chord-chart.png"));
    await page
      .getByRole("button", { name: "Save chart as image", exact: true })
      .click();
    expect(await app.evaluate(() => (globalThis as any).chartDownload)).toBe("completed");
  } finally {
    await app.close();
  }
});
