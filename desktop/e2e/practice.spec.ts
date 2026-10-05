import { test, expect } from "@playwright/test";
test("finishing a guided session offers and opens the next note pool", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.9;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Start first lesson" }).click();
  await page
    .getByRole("group", { name: "Session length", exact: true })
    .getByRole("button", { name: "5", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Reference C", exact: true })
    .getByRole("button", { name: "Off", exact: true })
    .click();
  await page.getByRole("button", { name: "Start session" }).click();
  for (let i = 0; i < 5; i++) {
    await expect(
      page.getByText(`Question ${i + 1} / 5`, { exact: true }),
    ).toBeVisible();
    const answer = page.getByRole("button", {
      name: i === 0 ? "C 01" : "G 02",
      exact: true,
    });
    await expect(answer).toBeEnabled();
    await answer.click();
  }
  await page.getByRole("button", { name: "Next lesson · 3 notes" }).click();
  await expect(
    page.getByRole("heading", { name: "Hear the major third", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".answer-grid .note-choice")).toHaveCount(3);
  await expect(page.getByRole("radio", { name: /^2\. / })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Your progress", exact: true })
    .click();
  await expect(
    page.locator(".achievement.earned").filter({ hasText: "First session" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ear training", exact: true }).click();
  await expect(page.getByRole("radio", { name: /^2\. / })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
test("custom notes, session settings, and new sounds persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start first lesson" }).click();
  await page
    .getByRole("group", { name: "Practice mode", exact: true })
    .getByRole("button", { name: "Choose my own notes" })
    .click();
  const notes = page.getByRole("group", {
    name: "Number of notes",
    exact: true,
  });
  await notes.getByRole("button", { name: "More notes" }).click();
  await notes.getByRole("button", { name: "More notes" }).click();
  await expect(page.locator(".answer-grid .note-choice")).toHaveCount(4);
  await page.evaluate(() => {
    const k = "aurynote.next.v1";
    const p = JSON.parse(localStorage.getItem(k)!);
    p.sessionLength = 15;
    localStorage.setItem(k, JSON.stringify(p));
  });
  await page.reload();
  await page.getByRole("button", { name: "Ear training", exact: true }).click();
  await page
    .getByRole("group", { name: "Practice mode", exact: true })
    .getByRole("button", { name: "Choose my own notes" })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Session length", exact: true })
      .getByRole("button", { name: "15", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({
    path: "artifacts/custom-practice.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Playback sound").selectOption("clarinet");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Your studio", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Your progress", exact: true })
    .click();
  await page.getByLabel("Daily goal", { exact: true }).selectOption("20");
  await page.reload();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Your progress", exact: true })
    .click();
  await expect(page.getByLabel("Daily goal", { exact: true })).toHaveValue(
    "20",
  );
  await page.getByRole("button", { name: "Ear training", exact: true }).click();
  await page
    .getByRole("group", { name: "Practice mode", exact: true })
    .getByRole("button", { name: "Choose my own notes" })
    .click();
  await expect(
    page
      .getByRole("group", { name: "Number of notes", exact: true })
      .getByText("4 notes"),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "Session length", exact: true })
      .getByRole("button", { name: "15", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Playback sound")).toHaveValue("clarinet");
});

test("empty progress page shows its message above the calendar", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Your progress", exact: true })
    .click();
  const empty = await page.locator(".empty").boundingBox();
  const calendar = await page.locator(".practice-activity").boundingBox();
  expect(empty!.y).toBeLessThan(calendar!.y);
});
