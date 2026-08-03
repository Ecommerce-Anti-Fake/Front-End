import { expect, test } from "@playwright/test";

const adminUsername = process.env.UAT_ADMIN_EMAIL;
const testPassword = process.env.UAT_TEST_PASSWORD;

test("seed admin can sign in and reach the admin console", async ({ page }) => {
  test.skip(!adminUsername || !testPassword, "UAT_ADMIN_EMAIL and UAT_TEST_PASSWORD are required");

  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill(adminUsername!);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(testPassword!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin(?:\/|$)/, { timeout: 15000 });
});
