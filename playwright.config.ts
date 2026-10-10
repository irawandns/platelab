import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
const basePath = process.env.PLAYWRIGHT_BASE_PATH || "/";
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(basePath)) {
  throw new Error(
    "PLAYWRIGHT_BASE_PATH must be a path such as / or /platelab/",
  );
}
const baseURL = new URL(basePath, "http://127.0.0.1:4173").href;
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1100 },
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: [
        "--no-sandbox",
        "--enable-unsafe-swiftshader",
        "--use-gl=angle",
        "--use-angle=swiftshader",
      ],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run preview -- --port 4173 --strictPort --base=${basePath}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
