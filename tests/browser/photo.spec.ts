import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";

async function ready(page: Page) {
  await expect(page.locator(".photo-preview canvas")).toHaveAttribute(
    "data-photo-ready",
    "true",
    { timeout: 20000 },
  );
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeEnabled();
}
async function download(page: Page, name: string) {
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PNG", exact: true }).click();
  const file = await promise;
  expect(await file.failure()).toBeNull();
  await file.saveAs(test.info().outputPath(name));
  const bytes = await readFile(test.info().outputPath(name));
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(bytes.readUInt32BE(16)).toBe(2048);
  expect(bytes.readUInt32BE(20)).toBe(2048);
  const colors = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = "data:image/png;base64," + base64;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    const values = new Set<string>();
    for (let i = 0; i < data.length; i += 4)
      values.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
    return values.size;
  }, bytes.toString("base64"));
  expect(colors).toBeGreaterThan(100);
  return file.suggestedFilename();
}

test("takes a high-resolution meal photo, changes looks, and preserves the editor", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  const button = page.getByRole("button", { name: "Take photo", exact: true });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
  for (const name of ["White rice", "Chicken breast", "Broccoli"])
    await page
      .getByRole("button", { name: `Add ${name}`, exact: true })
      .click();
  const canvas = page.locator('canvas[data-ready="true"]');
  await expect(canvas).toHaveAttribute("data-physics", "settled", {
    timeout: 15000,
  });
  const revision = await canvas.getAttribute("data-physics-revision");
  await page
    .getByRole("button", { name: "Rotate plate left", exact: true })
    .click();
  await button.click();
  await ready(page);
  await expect(
    page.getByRole("radio", { name: "Warm table", exact: false }),
  ).toBeChecked();
  await expect(
    page.getByRole("radio", { name: "Angled", exact: true }),
  ).toBeChecked();
  expect(await download(page, "warm-table.png")).toBe(
    "platelab-warm-table-angled.png",
  );
  await page
    .locator(".photo-preview")
    .screenshot({ path: test.info().outputPath("warm-preview.png") });
  await page.getByRole("radio", { name: "Studio", exact: false }).check();
  await ready(page);
  await page.getByRole("radio", { name: "Top view", exact: true }).check();
  await ready(page);
  await page
    .locator(".photo-preview")
    .screenshot({ path: test.info().outputPath("studio-preview.png") });
  await page.getByRole("radio", { name: "Dark", exact: false }).check();
  await ready(page);
  await page.getByRole("radio", { name: "Current view", exact: true }).check();
  await ready(page);
  await page
    .locator(".photo-preview")
    .screenshot({ path: test.info().outputPath("dark-preview.png") });
  expect(await download(page, "dark-current.png")).toBe(
    "platelab-dark-current.png",
  );
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Close photo mode", exact: true })
    .click();
  await expect(button).toBeFocused();
  await expect(page.getByTestId("total-calories")).toHaveText("330");
  await expect(canvas).toHaveAttribute("data-physics-revision", revision!);
  await button.click();
  await ready(page);
  await page.keyboard.press("Escape");
  await expect(button).toBeFocused();
  expect(errors).toEqual([]);
});

test("mobile photo controls fit and export a meal tray", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.locator(".plate-options > summary").click();
  await page.getByRole("radio", { name: "Meal tray", exact: true }).check();
  await page.getByRole("button", { name: "Add food", exact: true }).click();
  await page.getByRole("button", { name: "Add Bread", exact: true }).click();
  await expect(page.locator('canvas[data-ready="true"]')).toHaveAttribute(
    "data-physics",
    "settled",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await ready(page);
  const dialog = page.getByRole("dialog", {
    name: "Take a photo",
    exact: true,
  });
  const bounds = await dialog.boundingBox();
  expect(bounds!.height).toBeLessThanOrEqual(812);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("radio", { name: "Top view", exact: true }).check();
  await ready(page);
  await download(page, "mobile-tray.png");
  await page.screenshot({ path: test.info().outputPath("mobile-photo.png") });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Take photo", exact: true }),
  ).toBeFocused();
});

test("without WebGL the photo explains the limit and cannot export a blank image", async ({
  page,
}) => {
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
  await page
    .getByRole("button", { name: "Add White rice", exact: true })
    .click();
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await expect(
    page.getByText("Photo mode needs 3D.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("total-calories")).toHaveText("130");
});
