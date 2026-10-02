import { test, expect } from "@playwright/test";

test("tour can be completed, replayed, and dismissed without changing practice data", async ({
  page,
}) => {
  await page.goto("/");
  // Persist an ordinary preference first; a fresh studio does not write until edited.
  await page
    .getByLabel("Instrument key", { exact: true })
    .selectOption("tenor");
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("aurynote.next.v1")!),
  );
  await page.getByRole("button", { name: "Take a quick tour" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Find your next step" }),
  ).toBeFocused();
  await expect(
    dialog.getByRole("button", { name: "Back", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: "artifacts/tour-desktop.png" });
  const titles = [
    "Make it sound like you",
    "Listen, then name the note",
    "Turn symbols into sound",
    "Explore scales and chords",
    "Play it back on your instrument",
    "See your practice add up",
  ];
  for (const title of titles) {
    await dialog.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      dialog.getByRole("heading", { name: title, exact: true }),
    ).toBeFocused();
  }
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("aurynote.next.v1")!),
  );
  expect(after).toEqual({ ...before, tourSeen: true });
  await page.reload();
  await expect(page.getByLabel("Getting started")).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Quick tour", exact: true });
  await trigger.click();
  await dialog.getByRole("button", { name: "Next", exact: true }).click();
  await dialog.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    dialog.getByRole("heading", { name: "Find your next step" }),
  ).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("tour pauses a review and keeps the current question and score", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Staff reading", exact: true })
    .click();
  await page.getByRole("button", { name: "C", exact: true }).click();
  await page.getByRole("button", { name: "Quick tour", exact: true }).click();
  await page.waitForTimeout(3500);
  await expect(page.getByText("Question 01", { exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Skip tour", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Your answer: C");
  await expect(page.getByText("0 / 1 correct", { exact: true })).toBeVisible();
  await expect(page.getByText("Question 02", { exact: true })).toBeVisible();
});

test("tour and practice settings remain usable on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Quick tour", exact: true }).click();
  for (let i = 0; i < 7; i++) {
    const card = await page.locator(".tour-card").boundingBox();
    expect(card!.x).toBeGreaterThanOrEqual(0);
    expect(card!.x + card!.width).toBeLessThanOrEqual(390);
    expect(card!.y + card!.height).toBeLessThanOrEqual(844);
    await page
      .getByRole("button", { name: i === 6 ? "Done" : "Next", exact: true })
      .click();
  }
  await page
    .getByRole("button", { name: "Staff reading", exact: true })
    .click();
  await page.getByRole("button", { name: "♯ / ♭", exact: true }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await expect(page.getByLabel("Your note answer")).toBeVisible();
  await page.getByRole("button", { name: "Quick tour", exact: true }).click();
  await expect
    .poll(async () => {
      const rect = await page.locator(".tour-card").boundingBox();
      return rect!.x + rect!.width;
    })
    .toBeLessThanOrEqual(390);
  await page.screenshot({ path: "artifacts/tour-mobile.png" });
  await page.getByRole("button", { name: "Close tour" }).click();
  await page.getByRole("button", { name: "Ear training", exact: true }).click();
  await expect(page.getByLabel("Reference C", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
