import { expect, test } from "@playwright/test";

const publicRoutes = ["/", "/auth", "/register", "/community", "/live", "/qr"];

test.describe("guest public routes", () => {
  for (const route of publicRoutes) {
    test(`loads ${route} without a blank page`, async ({ page }) => {
      const serverErrors: string[] = [];
      page.on("response", (response) => {
        if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
      });

      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("body")).not.toBeEmpty();
      expect(serverErrors, `server errors on ${route}`).toEqual([]);
    });
  }
});
