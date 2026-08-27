import { expect, test } from "@playwright/test";

test.describe("profile navigation", () => {
  test("links QR verification to the supported public route", async ({ page }, testInfo) => {
    await page.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "{}",
      });
    });

    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
      }));
      localStorage.setItem("accessToken", `header.${payload}.signature`);
      localStorage.setItem("user", JSON.stringify({
        id: "profile-navigation-test",
        role: "buyer",
      }));
    });

    await page.goto("/profile", { waitUntil: "domcontentloaded" });

    if (testInfo.project.name === "mobile") {
      const menuButton = page.locator(".profile-menu-btn");
      await menuButton.click();
      await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    }

    await expect(
      page.getByRole("link", { name: "Xác thực sản phẩm bằng QR" }),
    ).toHaveAttribute("href", "/qr");
  });
});
