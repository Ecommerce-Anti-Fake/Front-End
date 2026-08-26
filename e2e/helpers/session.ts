import { expect, type Page } from "@playwright/test";

export function requiredCredential(name: "UAT_USER_EMAIL" | "UAT_SELLER_EMAIL" | "UAT_AFFILIATE_EMAIL") {
  const value = process.env[name] ?? process.env.UAT_USER_EMAIL;
  return value;
}

export function requiredPassword() {
  return process.env.UAT_TEST_PASSWORD;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email hoặc số điện thoại").fill(email);
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL(
    (url) => url.pathname !== "/auth" && url.pathname !== "/login",
    { timeout: 15000 },
  );
  await expect(page.locator("body")).not.toBeEmpty();
}

export async function assertNoServerErrors(page: Page, route: string) {
  const errors: string[] = [];
  const onResponse = (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  };
  page.on("response", onResponse);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  expect(errors, `server errors on ${route}`).toEqual([]);
  page.off("response", onResponse);
}
