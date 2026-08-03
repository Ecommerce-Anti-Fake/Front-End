import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("UAT_USER_EMAIL");
const password = requiredPassword();

const buyerRoutes = [
  "/profile",
  "/profile/address",
  "/profile/orders",
  "/profile/settings",
  "/profile/wallet",
  "/notification",
  "/messages",
  "/chat",
  "/cart",
];

test.describe("buyer authenticated read-only routes", () => {
  for (const route of buyerRoutes) {
    test(`loads ${route} without a server error`, async ({ page }) => {
      test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
      await loginAs(page, buyerEmail!, password!);
      await assertNoServerErrors(page, route);
      expect(new URL(page.url()).pathname).not.toBe("/auth");
    });
  }
});
