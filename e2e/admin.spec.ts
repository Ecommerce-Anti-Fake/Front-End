import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredPassword } from "./helpers/session";

const adminEmail = process.env.UAT_ADMIN_EMAIL;
const password = requiredPassword();

test("admin seed reaches the admin route when the account is active", async ({ page }) => {
  test.skip(!adminEmail || !password, "UAT_ADMIN_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, adminEmail!, password!);
  await assertNoServerErrors(page, "/admin");
  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
});
