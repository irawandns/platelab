import { expect, test } from "@playwright/test";

const additions = [
  "Potato",
  "Sweet potato",
  "Sweet corn",
  "Green peas",
  "Green beans",
  "Tomato",
  "Orange",
  "Strawberries",
];

test("adds the eight new foods with working portions, sources, thumbnails, and settled models", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  const search = page.getByRole("textbox", { name: "Search foods" });
  const canvas = page.locator('canvas[data-ready="true"]');
  for (const [index, name] of additions.entries()) {
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
    await expect(page.getByTestId("portion-label")).toHaveText("100 g");
  }
  await expect(page.getByTestId("total-calories")).toHaveText("474");
  await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(8);
  const details = page.locator(".source-details");
  if ((await details.getAttribute("open")) === null)
    await details.locator("summary").click();
  await expect(details).toContainText("Strawberries, raw");
  await page.getByRole("button", { name: "Large 2×" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("506");
  await expect(page.getByTestId("portion-label")).toHaveText("200 g");
  await page.getByRole("button", { name: "Undo last change" }).click();
  await expect(page.getByTestId("total-calories")).toHaveText("474");
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  await canvas.screenshot({ path: "test-results/food-variety.png" });
  expect(errors).toEqual([]);
});
