import { test, expect } from "@playwright/test";

test("switches to the stainless tray, moves food between wells, and restores the plate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.locator(".plate-options > summary").click();
  await page.getByRole("radio", { name: "Meal tray", exact: true }).check();
  await expect(
    page.getByRole("img", {
      name: /stainless meal tray, 29 by 23 centimetres, 5 compartments/,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Custom plate diameter")).toHaveCount(0);
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await canvas.screenshot({ path: "test-results/stainless-tray-empty.png" });
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Boiled egg", exact: true })
    .click();
  const energy = await page.getByTestId("total-calories").textContent();
  await page.getByLabel("Tray compartment").selectOption("round");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await expect(page.getByLabel("Tray compartment")).toHaveValue("round");
  await expect(page.getByTestId("total-calories")).toHaveText(energy!);
  await page.screenshot({
    path: "test-results/stainless-tray-meal.png",
    fullPage: true,
  });
  await page.getByRole("radio", { name: "Ceramic plate", exact: true }).check();
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("26");
  await expect(page.getByTestId("total-calories")).toHaveText(energy!);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(
    page.getByRole("radio", { name: "Meal tray", exact: true }),
  ).toBeChecked();
  await expect(page.getByLabel("Tray compartment")).toHaveValue("round");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("radio", { name: "Meal tray", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/stainless-tray-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
