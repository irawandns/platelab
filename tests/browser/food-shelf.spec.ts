import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("picks food from the first mobile screen and returns to the plate without page scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  const addFood = page.getByRole("button", { name: "Add food", exact: true });
  const sheet = page.getByRole("dialog", { name: "The food shelf" });
  await expect(addFood).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Add White rice", exact: true }),
  ).not.toBeVisible();
  await addFood.click();
  await expect(sheet).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close food shelf" }),
  ).toBeFocused();
  await expect(
    sheet.getByRole("button", { name: "Add White rice", exact: true }),
  ).toBeInViewport();
  await sheet
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await expect(sheet).not.toBeVisible();
  await expect(addFood).toBeFocused();
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await addFood.click();
  await sheet.getByRole("textbox", { name: "Search foods" }).fill("broccoli");
  await sheet
    .getByRole("button", { name: "Add Broccoli", exact: true })
    .click();
  await expect(sheet).not.toBeVisible();
  await expect(page.getByTestId("portion-label")).toHaveText("100 g");
  await expect(page.locator(".mobile-meal-summary")).toContainText("2 foods");
  await page.getByRole("button", { name: /^Large/ }).click();
  await expect(page.getByTestId("portion-label")).toHaveText("200 g");
  await expect(page.getByTestId("total-calories")).toHaveText("200");
  await expect(page.locator('canvas[data-ready="true"]')).toHaveAttribute(
    "data-physics",
    "settled",
    { timeout: 15000 },
  );
  await page.screenshot({
    path: "test-results/mobile-food-picker.png",
    fullPage: true,
  });
});

test("keeps the mobile shelf reachable after scrolling and supports filtering, dismissal, and desktop resizing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto("./");
  const addFood = page.getByRole("button", { name: "Add food", exact: true });
  const sheet = page.getByRole("dialog", { name: "The food shelf" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await expect(addFood).toBeInViewport();
  await addFood.click();
  await sheet.getByRole("button", { name: "Vegetables", exact: true }).click();
  await expect(
    sheet.getByRole("button", { name: "Add Broccoli", exact: true }),
  ).toBeInViewport();
  const search = sheet.getByRole("textbox", { name: "Search foods" });
  await search.fill("no-such-food");
  await expect(sheet.getByText("No foods found.")).toBeVisible();
  await sheet.getByRole("button", { name: "Show all foods" }).click();
  await expect(search).toHaveValue("");
  await sheet.getByRole("button", { name: "Close food shelf" }).click();
  await expect(addFood).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await addFood.click();
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  await expect(addFood).toBeFocused();
  await addFood.click();
  await page.mouse.click(8, 8);
  await expect(sheet).not.toBeVisible();
  await addFood.click();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(sheet).toHaveCount(0);
  await expect(addFood).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add White rice", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.setViewportSize({ width: 360, height: 640 });
  await expect(addFood).toBeInViewport();
  await expect(sheet).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("has no automated accessibility violations in the mobile food drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: "test-results/mobile-food-shelf.png" });
});
