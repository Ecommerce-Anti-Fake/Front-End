import { expect, test } from "@playwright/test";

for (const route of ["/", "/community", "/live", "/categories", "/qr", "/auth"]) {
  test(`responsive smoke ${route} has no horizontal overflow`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).not.toBeEmpty();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `horizontal overflow on ${route}`).toBeLessThanOrEqual(1);
  });
}
