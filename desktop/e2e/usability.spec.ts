import { test, expect } from "@playwright/test";

test("staff review can be paused and question generation remains bounded", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Staff reading", exact: true })
    .click();
  await page.getByRole("button", { name: "C", exact: true }).click();
  await expect(page.locator(".wrong-choice")).toContainText("Your answer");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.waitForTimeout(3500);
  await expect(page.getByText("Question 01", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next note", exact: true }).click();
  await expect(page.getByText("Question 02", { exact: true })).toBeVisible();
  await expect(page.locator(".answer-grid button")).toHaveCount(4);
  await page.getByRole("button", { name: "C", exact: true }).click();
  await expect(page.locator(".correct-popup")).toBeVisible();
});

test("harmony keyboard enables only notes in the selected pattern", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Scales & chords", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Play C", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Play D♭", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Chords", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Play D", exact: true }),
  ).toBeDisabled();
});

test("a canceled microphone request releases a late-arriving stream", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: () =>
        new Promise((resolve) => {
          (window as any).resolveMicrophone = () =>
            resolve({
              getTracks: () => [
                {
                  stop: () => {
                    (window as any).trackStopped = true;
                  },
                },
              ],
            });
        }),
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Play it back", exact: true }).click();
  await page.getByRole("button", { name: "Start microphone" }).click();
  await page.getByRole("button", { name: "Cancel microphone request" }).click();
  await page.evaluate(() => (window as any).resolveMicrophone());
  await expect
    .poll(() => page.evaluate(() => (window as any).trackStopped))
    .toBe(true);
  await expect(page.getByText("Microphone off", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start microphone" }),
  ).toBeEnabled();
});
