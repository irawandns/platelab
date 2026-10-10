import { test, expect } from "@playwright/test";
test("builds a meal, adjusts portions, removes, clears and undoes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(15);
  await expect(page.getByTestId("total-calories")).toHaveText("0");
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-empty.png",
    fullPage: true,
  });
  for (const name of ["White rice", "Chicken breast", "Broccoli"])
    await page
      .getByRole("button", { name: `Add ${name}`, exact: true })
      .click();
  await expect(page.getByTestId("total-calories")).toHaveText("330");
  await page.getByRole("button", { name: /^Select White rice/ }).click();
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("460");
  await expect(page.getByTestId("portion-label")).toHaveText("200 g");
  await page.getByRole("button", { name: "Move White rice right" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("460");
  await page.getByRole("button", { name: "Rotate plate left" }).click();
  await page.getByRole("button", { name: "Reset camera" }).click();
  await page.screenshot({
    path: "test-results/desktop-meal.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Remove White rice" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("200");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("460");
  await page.getByRole("button", { name: "Clear plate", exact: true }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("0");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("460");
  expect(errors).toEqual([]);
});
test("supports search, filtering, keyboard input, duplicate foods and source details", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Fruits", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(3);
  await page.getByRole("textbox", { name: "Search foods" }).fill("banana");
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(1);
  const banana = page.getByRole("button", { name: "Add Banana", exact: true });
  await banana.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /^Select Banana/ }),
  ).toHaveCount(2);
  await expect(page.getByTestId("total-calories")).toHaveText("210");
  await page.getByLabel("Edible weight").fill("59");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("158");
  await page.getByText("Serving & data source").click();
  await expect(
    page.getByText(/USDA household measure: 1 medium banana/),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search foods" }).fill("zzzz");
  await expect(page.getByText("No foods found.")).toBeVisible();
  await page.getByRole("button", { name: "Show all foods" }).click();
  await page.getByRole("button", { name: "Add Tempeh", exact: true }).click();
  await expect(page.getByTestId("total-fiber")).toContainText("+");
  await expect(
    page.getByText("Known fiber subtotal. Tempeh’s fiber is unreported."),
  ).toBeVisible();
  await expect(page.getByText("Unknown", { exact: true })).toBeVisible();
});
test("works on mobile, with reduced motion and an accessible help dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "How it works" }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Add Boiled egg", exact: true })
    .click();
  await expect(page.getByTestId("total-calories")).toHaveText("78");
  await page.getByRole("button", { name: "Increase portion" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("155");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-meal.png",
    fullPage: true,
  });
});

test("accepts library drops only on the plate and supports direct 3D movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .dragTo(canvas, {
      targetPosition: { x: box.width / 2, y: box.height / 2 },
    });
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await page
    .getByRole("button", { name: "Add Bread", exact: true })
    .dragTo(canvas, { targetPosition: { x: 5, y: 5 } });
  await expect(page.getByRole("button", { name: /^Select Bread/ })).toHaveCount(
    0,
  );
  // Rice was dropped near the origin. Drag its visible upper surface toward the right.
  const before = await canvas.screenshot();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 12);
  await page.mouse.down();
  await page.mouse.move(
    box.x + box.width / 2 + 65,
    box.y + box.height / 2 - 12,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: /^Select White rice/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  const after = await canvas.screenshot();
  expect(after.equals(before)).toBe(false);
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  const restored = await canvas.screenshot();
  expect(restored.equals(before)).toBe(true);
});

test("keeps the nutrition workflow usable without WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByText("3D isn’t available in this browser."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("260");
});

test("renders all fifteen models on tablet without overflow or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 900, height: 1100 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const addButtons = page.getByRole("button", { name: /^Add / });
  await expect(addButtons).toHaveCount(15);
  for (let index = 0; index < 15; index++) await addButtons.nth(index).click();
  await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(15);
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByLabel("Edible weight").fill("999");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByLabel("Edible weight")).toHaveValue("90");
  // Repeating an out-of-range value must still normalize the input when state is unchanged.
  await page.getByLabel("Edible weight").fill("999");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByLabel("Edible weight")).toHaveValue("90");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/tablet-all-foods.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
