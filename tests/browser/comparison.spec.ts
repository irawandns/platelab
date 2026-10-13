import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("compares portion edits, restores the original, and keeps changes with keyboard controls", async ({
  page,
}) => {
  await page.goto("./");
  const capture = page.getByRole("button", {
    name: "Compare changes",
    exact: true,
  });
  await expect(capture).toBeDisabled();
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await capture.focus();
  await capture.press("Enter");
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("original-calories")).toHaveText("130 kcal");
  await expect(page.getByTestId("current-calories")).toHaveText("260 kcal");
  await expect(
    page.getByTestId("difference-calories").locator('[aria-hidden="true"]'),
  ).toHaveText("+130 kcal");
  const original = page.locator(".comparison-original");
  await original.locator("summary").click();
  await expect(original).toContainText("100 g");
  const restore = page.getByRole("button", {
    name: "Restore original",
    exact: true,
  });
  await restore.focus();
  await restore.press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await expect(
    page.getByTestId("difference-calories").locator('[aria-hidden="true"]'),
  ).toHaveText("No change");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("260");
  await page
    .getByRole("button", { name: "Replace original", exact: true })
    .click();
  await expect(page.getByTestId("original-calories")).toHaveText("260 kcal");
  await page.getByRole("button", { name: "Small 0.5×" }).click();
  await expect(
    page.getByTestId("difference-calories").locator('[aria-hidden="true"]'),
  ).toHaveText("−195 kcal");
  const keep = page.getByRole("button", { name: "Keep changes", exact: true });
  await keep.focus();
  await keep.press("Enter");
  await expect(capture).toBeFocused();
  await expect(page.getByTestId("total-calories")).toHaveText("65");
  await expect(
    page.getByRole("table", { name: "Estimated nutrition changes" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(capture).toBeDisabled();
  await expect(page.getByTestId("total-calories")).toHaveText("0");
});

test("compares cooking oil and food swaps without treating missing fiber as zero", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Add Chicken breast", exact: true })
    .click();
  await page.getByRole("radio", { name: "Sear", exact: true }).check();
  await page
    .getByRole("button", { name: "Compare changes", exact: true })
    .click();
  await page.getByRole("radio", { name: "Pan-fry", exact: true }).check();
  await expect(page.getByTestId("original-calories")).toHaveText("183 kcal");
  await expect(page.getByTestId("current-calories")).toHaveText("209 kcal");
  await expect(
    page.getByTestId("difference-fat").locator('[aria-hidden="true"]'),
  ).toHaveText("+3 g");
  await page
    .getByRole("button", { name: "Remove Chicken breast", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Tempeh", exact: true }).click();
  await expect(page.getByTestId("current-fiber")).toHaveText("0+ g");
  await expect(
    page.getByTestId("difference-fiber").locator('[aria-hidden="true"]'),
  ).toHaveText("Unknown");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Restore original", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "Sear", exact: true }),
  ).toBeChecked();
  await expect(page.getByTestId("total-calories")).toHaveText("183");
  await expect(
    page.getByTestId("difference-fiber").locator('[aria-hidden="true"]'),
  ).toHaveText("No change");
});

test("keeps the original after clearing on mobile and works without WebGL", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (["webgl", "webgl2", "experimental-webgl"].includes(type)) return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("./");
  await expect(
    page.getByText("3D isn’t available in this browser."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Compare changes", exact: true })
    .click();
  await page.getByRole("button", { name: "Clear plate", exact: true }).click();
  await expect(page.getByTestId("original-calories")).toHaveText("130 kcal");
  await expect(page.getByTestId("current-calories")).toHaveText("0 kcal");
  await expect(
    page.getByTestId("difference-calories").locator('[aria-hidden="true"]'),
  ).toHaveText("−130 kcal");
  await expect(
    page.getByRole("button", { name: "Replace original", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Restore original", exact: true })
    .click();
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await page.locator(".comparison-original > summary").click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Clear plate", exact: true }).click();
  await page.getByRole("button", { name: "Keep changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "What if?", exact: true }),
  ).toBeFocused();
});
