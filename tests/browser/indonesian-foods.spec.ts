import { test, expect } from "@playwright/test";

test("builds an Indonesian meal with TKPI sources and independent portions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  const canvas = page.locator('canvas[data-ready="true"]');
  const search = page.getByRole("textbox", { name: "Search foods" });
  for (const [index, name] of [
    "Timun",
    "Kerupuk",
    "Ikan kembung",
    "Bakwan sayur",
  ].entries()) {
    await search.fill(name);
    const card = page.getByRole("button", { name: `Add ${name}`, exact: true });
    await expect(card.locator("svg path, svg ellipse")).not.toHaveCount(0);
    await card.click();
    await expect(canvas).toHaveAttribute(
      "data-physics-revision",
      String(index + 1),
    );
    await expect(canvas).toHaveAttribute("data-physics", "settled", {
      timeout: 15000,
    });
    if ((await page.locator(".source-details").getAttribute("open")) === null)
      await page.locator(".source-details > summary").click();
    const details = page.getByRole("region", { name: "Food nutrition details" });
    await expect(details).toContainText("Tabel Komposisi Pangan Indonesia");
    await expect(details.getByRole("link", { name: "TKPI source documentation" }))
      .toHaveAttribute("href", /#page=\d+$/);
  }
  await expect(page.getByTestId("total-calories")).toHaveText("317");
  await expect(page.locator(".data-warning")).toContainText("Ikan kembung");
  await expect(page.locator(".data-warning")).not.toContainText("Tempeh");
  await page.screenshot({
    path: "test-results/indonesian-meal.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("portion-label")).toHaveText("100 g");
  await expect(page.getByTestId("total-calories")).toHaveText("457");
  await page.getByRole("button", { name: /^Select Timun/ }).click();
  await expect(page.getByTestId("portion-label")).toHaveText("50 g");
  await page.getByRole("button", { name: /^Select Ikan kembung/ }).click();
  const details = page.getByRole("region", { name: "Food nutrition details" });
  await expect(details).toContainText("Fresh/raw");
  await expect(details).toContainText("Unknown");
  await page.getByRole("button", { name: "Remove Ikan kembung" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("332");
  await expect(page.locator(".data-warning")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("457");
  await expect(page.locator(".data-warning")).toContainText("Ikan kembung");
  expect(errors).toEqual([]);
});

test("finds Indonesian foods in the mobile shelf and adds them to a meal tray", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.locator(".plate-options > summary").click();
  await page.getByRole("radio", { name: "Meal tray", exact: true }).check();
  const sheet = page.getByRole("dialog", { name: "The food shelf" });
  for (const name of ["Timun", "Kerupuk", "Ikan kembung", "Bakwan sayur"]) {
    await page.getByRole("button", { name: "Add food", exact: true }).click();
    await sheet.getByRole("textbox", { name: "Search foods" }).fill(name);
    await sheet.getByRole("button", { name: `Add ${name}`, exact: true }).click();
    await expect(sheet).not.toBeVisible();
    await expect(page.locator('canvas[data-ready="true"]')).toHaveAttribute(
      "data-physics",
      "settled",
      { timeout: 15000 },
    );
  }
  await expect(page.getByTestId("total-calories")).toHaveText("317");
  await expect(page.getByTestId("portion-label")).toHaveText("50 g");
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
  await page.screenshot({
    path: "test-results/indonesian-tray-mobile.png",
    fullPage: true,
  });
});
