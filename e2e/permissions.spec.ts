import { expect, test } from "@playwright/test";
import { requiredCredential, requiredPassword } from "./helpers/session";

test("guest access to admin redirects to authentication", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
});

test("guest access to checkout redirects to authentication", async ({ page }) => {
  await page.goto("/checkout", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
});

test("guest access to wishlist redirects to authentication", async ({ page }) => {
  await page.goto("/wishlist", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
});

test("guest access to a direct message room redirects to authentication", async ({ page }) => {
  await page.goto("/messages/00000000-0000-0000-0000-000000000000", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
});

for (const route of ["/payment", "/payment-success", "/payment-failed"]) {
  test(`guest access to ${route} redirects to authentication`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  });
}

test("authenticated non-admin is redirected away from admin", async ({ page }) => {
  const username = requiredCredential("buyer");
  const password = requiredPassword("buyer");
  test.skip(!username || !password, "ANTIFAKE_UAT_BUYER_EMAIL and ANTIFAKE_UAT_BUYER_PASSWORD are required");

  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill(username!);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(password!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
});
