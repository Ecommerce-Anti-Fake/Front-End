import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("buyer");
const password = requiredPassword("buyer");

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
  test("loads all buyer routes without a server error", async ({ page }) => {
    test.skip(!buyerEmail || !password, "ANTIFAKE_UAT_BUYER_EMAIL and ANTIFAKE_UAT_BUYER_PASSWORD are required");
    await loginAs(page, buyerEmail!, password!, "buyer");

    for (const route of buyerRoutes) {
      await assertNoServerErrors(page, route);
      expect(new URL(page.url()).pathname).not.toBe("/auth");
    }
  });
});
