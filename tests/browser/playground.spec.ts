import { test, expect, type Locator, type Page } from "@playwright/test";

async function settledCanvasScreenshot(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-physics", "settled");
  let current = await canvas.screenshot();
  // Physics can be asleep before its final frame reaches the compositor.
  // Require two matching captures for the baseline as well as the restoration.
  await expect
    .poll(async () => {
      const previous = current;
      current = await canvas.screenshot();
      return current.equals(previous);
    })
    .toBe(true);
  return current;
}

async function undoRenderedScene(page: Page, canvas: Locator) {
  const revision = Number(await canvas.getAttribute("data-physics-revision"));
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(canvas).toHaveAttribute(
    "data-physics-revision",
    String(revision + 1),
  );
  await expect(canvas).toHaveAttribute("data-physics", "settled");
}

async function restoredCanvasScreenshot(canvas: Locator, before: Buffer) {
  await expect(canvas).toHaveAttribute("data-physics", "settled");
  let restored = await canvas.screenshot();
  await expect
    .poll(
      async () => {
        const previous = restored;
        restored = await canvas.screenshot();
        // Each poll captures one frame. Nesting the two-capture stabilization
        // poll here can exhaust the outer deadline even when the images match.
        return restored.equals(previous) && restored.equals(before);
      },
      { message: "Undo restores the original canvas image exactly" },
    )
    .toBe(true);
  return restored;
}
test("builds a meal, adjusts portions, removes, clears and undoes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(11);
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
  await page.goto("./");
  await page.getByRole("button", { name: "Fruits", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search foods" }).fill("avocado");
  await expect(page.getByRole("button", { name: /^Add / })).toHaveCount(1);
  const avocado = page.getByRole("button", {
    name: "Add Avocado",
    exact: true,
  });
  await avocado.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /^Select Avocado/ }),
  ).toHaveCount(2);
  await expect(page.getByTestId("total-calories")).toHaveText("320");
  await page.getByLabel("Edible weight").fill("50");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("240");
  await page.getByText("Serving & data source").click();
  await expect(
    page.getByText(/Raw edible flesh, without peel or stone/),
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
  await page.goto("./");
  await page.getByRole("button", { name: "How it works" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "How it works" }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Add food", exact: true }),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Add food", exact: true }).click();
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
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .dragTo(canvas, {
      targetPosition: { x: box.width / 2, y: box.height / 2 },
    });
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Add Bread", exact: true })
    .dragTo(canvas, { targetPosition: { x: 5, y: 5 } });
  await expect(page.getByRole("button", { name: /^Select Bread/ })).toHaveCount(
    0,
  );
  // Rice was dropped near the origin. Drag its visible upper surface toward the right.
  const before = await settledCanvasScreenshot(canvas);
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
  const after = await settledCanvasScreenshot(canvas);
  expect(after.equals(before)).toBe(false);
  for (const [name, body] of [
    ["before-food-drag", before],
    ["after-food-drag", after],
  ] as const)
    await testInfo.attach(name, { body, contentType: "image/png" });
  await undoRenderedScene(page, canvas);
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  const restored = await restoredCanvasScreenshot(canvas, before);
  await testInfo.attach("after-food-drag-undo", {
    body: restored,
    contentType: "image/png",
  });
});

test("settles stacked foods and restores the arrangement after removal", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Add Firm tofu", exact: true })
      .dragTo(canvas, {
        targetPosition: { x: box.width / 2, y: box.height / 2 },
      });
    await expect(canvas).toHaveAttribute(
      "data-physics-revision",
      String(i + 1),
    );
    await expect(canvas).toHaveAttribute("data-physics", "settled", {
      timeout: 15000,
    });
  }
  await expect(
    page.getByRole("button", { name: /^Select Firm tofu/ }),
  ).toHaveCount(3);
  await expect(
    page.getByText("Drag onto another food to stack it.", { exact: false }),
  ).toBeVisible();
  const energy = await page.getByTestId("total-calories").textContent();
  const before = await settledCanvasScreenshot(canvas);
  await page
    .getByRole("button", { name: "Remove Firm tofu", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-physics-revision", "4");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await undoRenderedScene(page, canvas);
  await expect(page.getByTestId("total-calories")).toHaveText(energy!);
  await restoredCanvasScreenshot(canvas, before);
  expect(errors).toEqual([]);
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
  await page.goto("./");
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

test("renders all eleven models on tablet without overflow or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 900, height: 1100 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const addButtons = page.getByRole("button", { name: /^Add / });
  await expect(addButtons).toHaveCount(11);
  for (let index = 0; index < 11; index++) await addButtons.nth(index).click();
  await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(11);
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toBeVisible();
  // The DOM controls and the canvas use separate React roots. Confirm that the
  // renderer processed all eleven additions before testing the next edit.
  await expect(canvas).toHaveAttribute("data-physics-revision", "11");
  await page.getByLabel("Edible weight").fill("999");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByLabel("Edible weight")).toHaveValue("90");
  await expect(canvas).toHaveAttribute("data-physics-revision", "12");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  // Repeating an out-of-range value must still normalize the input when state is unchanged.
  await page.getByLabel("Edible weight").fill("999");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByLabel("Edible weight")).toHaveValue("90");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("changes custom plate diameter without changing nutrition and supports undo", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.locator(".plate-options > summary").click();
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("26");
  await page.getByRole("button", { name: "Add Broccoli", exact: true }).click();
  await page.getByLabel("Edible weight").fill("300");
  await page.getByLabel("Edible weight").press("Enter");
  await expect(page.getByTestId("portion-label")).toHaveText("300 g");
  const energy = await page.getByTestId("total-calories").textContent();
  await page.getByLabel("Custom plate diameter").fill("18");
  await page.getByLabel("Custom plate diameter").press("Enter");
  await expect(
    page.getByRole("img", { name: /Interactive 3D plate, 18 centimetres/ }),
  ).toBeVisible();
  await expect(page.getByTestId("total-calories")).toHaveText(energy!);
  await expect(page.getByTestId("portion-label")).toHaveText("300 g");
  await expect(page.getByText(/A portion extends beyond/)).toBeVisible();
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("26");
  await expect(page.getByText(/A portion extends beyond/)).toHaveCount(0);
  await page.screenshot({
    path: "test-results/default-26cm-broccoli.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "32 cm", exact: true }).click();
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("32");
  await page.getByLabel("Custom plate diameter").fill("999");
  await page.getByLabel("Custom plate diameter").press("Enter");
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("36");
  await page.getByLabel("Custom plate diameter").fill("999");
  await page.getByLabel("Custom plate diameter").press("Enter");
  await expect(page.getByLabel("Custom plate diameter")).toHaveValue("36");
  await page.screenshot({
    path: "test-results/physical-scale-broccoli.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Custom plate diameter")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("collapses plate options and changes skins without changing the meal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const options = page.locator(".plate-options");
  const summary = options.locator("summary");
  await expect(options).not.toHaveAttribute("open");
  await expect(summary).toContainText("26 cm · Cream");
  await expect(page.getByLabel("Custom plate diameter")).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("radio", { name: "Cream" })).toBeChecked();
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  const before = await settledCanvasScreenshot(canvas);
  await page.getByRole("radio", { name: "Sage", exact: true }).check();
  await expect(summary).toContainText("26 cm · Sage");
  await expect(
    page.getByRole("img", { name: /26 centimetres in diameter, Sage skin/ }),
  ).toBeVisible();
  expect((await settledCanvasScreenshot(canvas)).equals(before)).toBe(false);
  await undoRenderedScene(page, canvas);
  await expect(page.getByRole("radio", { name: "Cream" })).toBeChecked();
  await restoredCanvasScreenshot(canvas, before);
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page.getByRole("radio", { name: "Cream" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Sage" })).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Blue" })).toBeChecked();
  await expect(page.getByTestId("total-calories")).toHaveText("130");
  await expect(page.getByTestId("portion-label")).toHaveText("100 g");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("radio", { name: "Blue" })).toBeVisible();
  await page.screenshot({
    path: "test-results/mobile-plate-options.png",
    fullPage: true,
  });
  await summary.click();
  await expect(page.getByRole("radio", { name: "Blue" })).not.toBeVisible();
  await expect(summary).toContainText("26 cm · Blue");
  await summary.click();
  await expect(page.getByRole("radio", { name: "Blue" })).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
