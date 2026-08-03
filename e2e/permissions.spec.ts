import { expect, test } from "@playwright/test";

test("guest access to admin redirects to authentication", async ({ page }) => {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
});

test("authenticated non-admin is redirected away from admin", async ({ page }) => {
  const username = process.env.UAT_USER_EMAIL;
  const password = process.env.UAT_TEST_PASSWORD;
  test.skip(!username || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");

  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill(username!);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(password!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });

  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/$/);
});
