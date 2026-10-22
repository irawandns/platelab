import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("save is beside the plate and the comparison section is gone", async ({
  page,
}) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "Save plate", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save plate", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "What if?", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Compare changes", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page.getByRole("button", { name: "Large 2×" }).click();
  await page.getByRole("link", { name: "PlateLab home", exact: true }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("260");
  await page.getByRole("button", { name: "Save plate", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Save your plate", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Plate name", { exact: true })).toHaveValue(
    "White rice",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved “White rice”" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save plate", exact: true }),
  ).toBeFocused();
});

test("saves the current plate across reload, loads it, undoes loading, and deletes with confirmation", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page.getByRole("button", { name: "Large 2×" }).click();
  await page.getByRole("button", { name: "Save plate", exact: true }).click();
  await page.getByLabel("Plate name", { exact: true }).fill("More rice");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("total-calories")).toHaveText("0");
  await page.getByRole("button", { name: "Add Broccoli", exact: true }).click();
  await page
    .getByRole("button", { name: "Saved plates 1", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog", { name: "Saved plates", exact: true }),
  ).toContainText("1 food · 260 kcal");
  await page
    .getByRole("button", { name: "Load plate: More rice", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByTestId("total-calories")).toHaveText("260");
  await page
    .getByRole("button", { name: "Undo last change", exact: true })
    .click();
  await expect(page.getByTestId("total-calories")).toHaveText("35");
  await page
    .getByRole("button", { name: "Saved plates 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete plate: More rice", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load plate: More rice", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete plate: More rice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm delete", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("No saved plates yet");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Saved plates 0", exact: true }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved plates 0", exact: true }),
  ).toBeVisible();
});

test("mobile saving works without WebGL and retains unknown nutrient data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      kind: string,
      ...args: unknown[]
    ) {
      if (kind.includes("webgl")) return null;
      return original.apply(this, [kind, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page.getByRole("button", { name: "Add Tempeh", exact: true }).click();
  await page.getByRole("button", { name: "Save plate", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Saved plates 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load plate: Tempeh", exact: true })
    .click();
  await expect(page.getByTestId("total-fiber")).toHaveText("0+ g");
  await expect(
    page.getByText("3D isn’t available in this browser."),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
});

test("old saved comparisons load their changed plate without exposing a comparison", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const plate = (grams: number) => ({
      plateType: "ceramic",
      plateSkin: "cream",
      plateDiameterCm: 26,
      selectedItemId: "rice",
      items: [
        {
          instanceId: "rice",
          foodId: "rice",
          portionGrams: grams,
          position: [0, 0],
        },
      ],
    });
    if (!localStorage.getItem("platelab.experiments.v1"))
      localStorage.setItem(
        "platelab.experiments.v1",
        JSON.stringify({
          version: 1,
          entries: [
            {
              id: "old",
              title: "Existing rice",
              createdAt: "2026-10-22T00:00:00Z",
              original: plate(100),
              current: plate(200),
            },
          ],
        }),
      );
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Saved plates 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Load plate: Existing rice", exact: true })
    .click();
  await expect(page.getByTestId("total-calories")).toHaveText("260");
  await expect(
    page.getByRole("heading", { name: "What if?", exact: true }),
  ).toHaveCount(0);
});

test("failed saving keeps the name and current meal", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "platelab.experiments.v1")
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page.getByRole("button", { name: "Save plate", exact: true }).click();
  await page.getByLabel("Plate name", { exact: true }).fill("Keep my meal");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("couldn’t be saved");
  await expect(page.getByLabel("Plate name", { exact: true })).toHaveValue(
    "Keep my meal",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("total-calories")).toHaveText("130");
});
