import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredPassword } from "./helpers/session";

const adminEmail = process.env.UAT_ADMIN_EMAIL;
const password = requiredPassword();
const adminReadOnlyRoutes = [
  "/admin",
  "/admin/users",
  "/admin/shop-registrations",
  "/admin/product-registrations",
  "/admin/vouchers",
  "/admin/categories",
  "/admin/wallet",
  "/admin/chat",
  "/admin/withdraw-requests",
] as const;

test("admin seed reaches the admin route when the account is active", async ({ page }) => {
  test.skip(!adminEmail || !password, "UAT_ADMIN_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, adminEmail!, password!);
  await assertNoServerErrors(page, "/admin");
  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
});

test("admin read-only route inventory renders without server errors", async ({ page }) => {
  test.skip(!adminEmail || !password, "UAT_ADMIN_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, adminEmail!, password!);

  for (const route of adminReadOnlyRoutes) {
    await assertNoServerErrors(page, route);
    expect(new URL(page.url()).pathname, `route should remain ${route}`).toBe(route);
  }
});
