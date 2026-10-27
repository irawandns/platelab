import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("compares method presets, edits oil in spoon units, and restores assumptions", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Add Chicken breast", exact: true })
    .click();
  const panel = page.getByRole("region", {
    name: "Cooking experiment",
    exact: true,
  });
  await expect(
    panel.getByRole("radio", { name: "As prepared", exact: true }),
  ).toBeChecked();
  await expect(page.getByTestId("total-calories")).toHaveText("165");
  await panel.getByRole("radio", { name: "Sear", exact: true }).check();
  await expect(page.getByTestId("total-calories")).toHaveText("183");
  await expect(
    page.getByLabel("Oil amount", { exact: true }),
  ).not.toBeVisible();
  await panel.getByRole("radio", { name: "Deep-fry", exact: true }).check();
  await expect(page.getByTestId("total-calories")).toHaveText("253");
  await expect(page.getByTestId("cooking-assumption")).toContainText(
    "Example preset · 10 g",
  );
  await panel.locator("summary").click();
  await page.getByLabel("Oil type", { exact: true }).selectOption("olive");
  await page.getByLabel("Oil amount unit").selectOption("tbsp");
  const amount = page.getByLabel("Oil amount", { exact: true });
  await amount.fill("1");
  await amount.press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("284");
  await expect(page.getByTestId("cooking-assumption")).toContainText(
    "Custom amount · 13.5 g",
  );
  await expect(page.getByTestId("cooked-calories")).toHaveText("284 kcal");
  await expect(page.getByTestId("total-fat")).toHaveText("17.1 g");
  await expect(page.getByLabel("Food nutrition details")).toContainText(
    "includes 13.5 g added oil",
  );
  await page.getByLabel("Oil amount unit").selectOption("g");
  await expect(amount).toHaveValue("13.5");
  await page.getByLabel("Oil amount unit").selectOption("tsp");
  await expect(amount).toHaveValue("3");
  await expect(page.getByTestId("total-calories")).toHaveText("284");
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("449");
  await expect(amount).toHaveValue("3");
  await page.getByRole("button", { name: "Reset to method preset" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("507");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(amount).toHaveValue("3");
  await expect(page.getByTestId("total-calories")).toHaveText("449");
  await panel.getByRole("radio", { name: "As prepared", exact: true }).check();
  await expect(page.getByTestId("total-calories")).toHaveText("330");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("449");
  await page.screenshot({
    path: "test-results/cooking-desktop.png",
    fullPage: true,
  });
});

test("counts retained oil, normalizes invalid input, and exposes accessible controls", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Add Firm tofu", exact: true })
    .click();
  await page.getByRole("radio", { name: "Pan-fry", exact: true }).check();
  await page.locator(".cooking-details > summary").click();
  await page.getByLabel("Amount refers to").selectOption("used");
  const amount = page.getByLabel("Oil amount", { exact: true });
  await amount.fill("10");
  await amount.press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("232");
  const retention = page.getByRole("slider", { name: /Oil ending up/ });
  await retention.focus();
  await retention.press("Home");
  await expect(page.getByTestId("total-calories")).toHaveText("144");
  await retention.press("ArrowRight");
  await expect(page.getByTestId("cooking-assumption")).toContainText(
    "0.1 g oil",
  );
  await expect(page.getByTestId("total-calories")).toHaveText("145");
  await page.getByLabel("Amount refers to").selectOption("in-serving");
  await expect(amount).toHaveValue("0.1");
  await expect(retention).not.toBeVisible();
  await amount.fill("");
  await amount.press("Enter");
  await expect(amount).toHaveValue("0.1");
  await amount.fill("999");
  await amount.press("Enter");
  await expect(amount).toHaveValue("100");
  await amount.fill("999");
  await amount.press("Enter");
  await expect(amount).toHaveValue("100");
  await amount.fill("-2");
  await amount.press("Enter");
  await expect(amount).toHaveValue("0");
  await expect(page.getByTestId("total-calories")).toHaveText("144");
  await page.getByLabel("Amount refers to").selectOption("used");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("keeps experiments independent on mobile and without WebGL", async ({
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
    .getByRole("button", { name: "Add Firm tofu", exact: true })
    .click();
  await page.getByRole("radio", { name: "Pan-fry", exact: true }).check();
  await expect(page.getByTestId("total-calories")).toHaveText("188");
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page
    .getByRole("button", { name: "Add Firm tofu", exact: true })
    .click();
  await expect(
    page.getByRole("radio", { name: "As prepared", exact: true }),
  ).toBeChecked();
  await expect(page.getByTestId("total-calories")).toHaveText("332");
  await page
    .getByRole("button", { name: /^Select Firm tofu/ })
    .first()
    .click();
  await expect(
    page.getByRole("radio", { name: "Pan-fry", exact: true }),
  ).toBeChecked();
  await page.locator(".cooking-details > summary").click();
  await page.getByLabel("Oil amount unit").selectOption("tbsp");
  await page.getByLabel("Oil amount", { exact: true }).fill("0.5");
  await page.getByLabel("Oil amount", { exact: true }).press("Enter");
  await expect(page.getByTestId("total-calories")).toHaveText("348");
  await page.screenshot({
    path: "test-results/cooking-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Clear plate", exact: true }).click();
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("348");
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Cooking experiment" }),
  ).toHaveCount(0);
});

for (const mobile of [false, true]) {
  test(`offers cooking methods for the protein category on ${mobile ? "mobile" : "desktop"}`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./");
    const panel = page.getByRole("region", {
      name: "Cooking experiment",
      exact: true,
    });
    for (const food of [
      { name: "Boiled egg", calories: 77.5, grams: 50 },
      { name: "Chicken breast", calories: 165, grams: 100 },
      { name: "Salmon", calories: 206, grams: 100 },
      { name: "Firm tofu", calories: 144, grams: 100 },
      { name: "Tempeh", calories: 195, grams: 100 },
      { name: "Ikan kembung", calories: 125, grams: 100 },
    ]) {
      if (mobile)
        await page
          .getByRole("button", { name: "Add food", exact: true })
          .click();
      await page
        .getByRole("button", { name: `Add ${food.name}`, exact: true })
        .click();
      await expect(
        panel.getByRole("radio", { name: "As prepared", exact: true }),
      ).toBeChecked();
      for (const [method, oilPer100g] of [
        ["Sear", 2],
        ["Pan-fry", 5],
        ["Deep-fry", 10],
        ["Air-fry", 1],
      ] as const) {
        await panel.getByRole("radio", { name: method, exact: true }).check();
        await expect(page.getByTestId("total-calories")).toHaveText(
          Math.round(
            food.calories + ((oilPer100g * food.grams) / 100) * 8.84,
          ).toString(),
        );
      }
      await panel
        .getByRole("radio", { name: "As prepared", exact: true })
        .check();
      await expect(page.getByTestId("total-calories")).toHaveText(
        Math.round(food.calories).toString(),
      );
      await page.getByRole("button", { name: "Undo last change" }).click();
      await expect(
        panel.getByRole("radio", { name: "Air-fry", exact: true }),
      ).toBeChecked();
      await expect(panel).toContainText("not measured frying absorption");
      await page
        .getByRole("button", { name: "Clear plate", exact: true })
        .click();
    }
    if (mobile)
      await page.getByRole("button", { name: "Add food", exact: true }).click();
    await page
      .getByRole("button", { name: "Add White rice", exact: true })
      .click();
    await expect(panel).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
