import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("has no automated WCAG A/AA violations in empty, selected and help states", async ({
  page,
}) => {
  await page.goto("./");
  const scan = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  };
  await scan();
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await scan();
  await page.locator(".plate-options > summary").click();
  await page.getByRole("radio", { name: "Blue" }).check();
  await scan();
  await page.getByRole("button", { name: "How it works" }).click();
  await scan();
});
