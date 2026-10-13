import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const state of [
  "empty",
  "selected food",
  "plate options",
  "help dialog",
]) {
  test(`has no automated WCAG A/AA violations in the ${state} state`, async ({
    page,
  }) => {
    await page.goto("./");
    if (state !== "empty")
      await page
        .getByRole("button", { name: "Add White rice", exact: true })
        .click();
    if (state === "plate options" || state === "help dialog") {
      await page.locator(".plate-options > summary").click();
      await page.getByRole("radio", { name: "Blue" }).check();
    }
    if (state === "help dialog")
      await page.getByRole("button", { name: "How it works" }).click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  });
}
