import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.UAT_BASE_URL?.trim();

if (!baseURL) {
  throw new Error(
    "UAT_BASE_URL is required for the dedicated UAT browser target",
  );
}

const parsedURL = new URL(baseURL);
const hostname = parsedURL.hostname.toLowerCase();
const productionHosts = new Set([
  "antifake.io.vn",
  "www.antifake.io.vn",
  "api.antifake.io.vn",
]);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

if (
  !["http:", "https:"].includes(parsedURL.protocol) ||
  parsedURL.username ||
  parsedURL.password ||
  productionHosts.has(hostname) ||
  (!localHosts.has(hostname) && !/(uat|staging|test)/i.test(hostname))
) {
  throw new Error(
    "UAT_BASE_URL must be a credential-free local or explicitly non-production URL",
  );
}

const injectedQrCode = process.env.UAT_QR_CODE?.trim().toUpperCase();
if (injectedQrCode && !/^UAT[-_][A-Z0-9_-]+$/.test(injectedQrCode)) {
  throw new Error("UAT_QR_CODE must use the synthetic UAT namespace");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: ".uat-runtime/playwright-report", open: "never" }],
  ],
  outputDir: ".uat-runtime/test-results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: process.env.UAT_VIDEO === "true" ? "retain-on-failure" : "off",
    browserName: "chromium",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
