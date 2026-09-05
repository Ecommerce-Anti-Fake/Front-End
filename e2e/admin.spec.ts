import { expect, test } from "@playwright/test";
import {
  assertNoServerErrors,
  loginAs,
  requiredCredential,
  requiredPassword,
} from "./helpers/session";

const adminEmail = requiredCredential("admin");
const password = requiredPassword("admin");
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
  test.skip(!adminEmail || !password, "ANTIFAKE_UAT_ADMIN_EMAIL and ANTIFAKE_UAT_ADMIN_PASSWORD are required");
  await loginAs(page, adminEmail!, password!, "admin");
  await assertNoServerErrors(page, "/admin");
  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
});

test("admin read-only route inventory renders without server errors", async ({ page }) => {
  test.skip(!adminEmail || !password, "ANTIFAKE_UAT_ADMIN_EMAIL and ANTIFAKE_UAT_ADMIN_PASSWORD are required");
  await loginAs(page, adminEmail!, password!, "admin");

  for (const route of adminReadOnlyRoutes) {
    await assertNoServerErrors(page, route);
    expect(new URL(page.url()).pathname, `route should remain ${route}`).toBe(route);
  }
});
