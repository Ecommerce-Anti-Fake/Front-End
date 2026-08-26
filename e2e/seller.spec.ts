import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const sellerEmail = requiredCredential("UAT_SELLER_EMAIL");
const password = requiredPassword();

const sellerRoutes = [
  "/seller",
  "/seller/dashboard",
  "/seller/products",
  "/seller/orders",
  "/seller/wallet",
  "/seller/affiliate",
  "/seller/vouchers",
  "/seller/live",
  "/seller/statistics",
  "/seller/shop-info",
  "/seller/business-info",
  "/seller/chat",
];

test.describe("seller authenticated read-only routes", () => {
  for (const route of sellerRoutes) {
    test(`loads ${route} without a server error`, async ({ page }) => {
      test.skip(!sellerEmail || !password, "UAT_SELLER_EMAIL and UAT_TEST_PASSWORD are required");
      await loginAs(page, sellerEmail!, password!);
      await assertNoServerErrors(page, route);
      expect(new URL(page.url()).pathname).not.toBe("/auth");
      if (route === "/seller") {
        await expect(page).toHaveURL(/\/seller\/dashboard(?:\/|$)/);
      }
    });
  }
});
