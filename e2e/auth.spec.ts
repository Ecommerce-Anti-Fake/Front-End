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

test("unknown credentials stay on auth with a recoverable error", async ({ page }) => {
  const serverErrors: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill("uat-nonexistent@example.invalid");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("invalid-only-for-uat");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/auth(?:\?|$)/);
  await expect(page.locator("body")).not.toBeEmpty();
  expect(serverErrors).toEqual([]);
});

test("buyer auth switches from login to a settled registration form", async ({ page }) => {
  await page.goto("/auth", { waitUntil: "networkidle" });
  await expect(page.locator('input[type="password"]').first()).toBeVisible();

  await page.locator(".login-register button").click();
  const registrationCard = page.locator(".register-card");
  await expect(registrationCard).toBeVisible();
  await expect
    .poll(async () => registrationCard.evaluate((element) => getComputedStyle(element).opacity))
    .toBe("1");
  await expect(page.locator(".loading-overlay")).toHaveCount(0);
});
