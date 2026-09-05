import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const sellerEmail = requiredCredential("seller");
const password = requiredPassword("seller");

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
  test("loads all seller routes without a server error", async ({ page }) => {
    test.skip(!sellerEmail || !password, "ANTIFAKE_UAT_SELLER_EMAIL and ANTIFAKE_UAT_SELLER_PASSWORD are required");
    await loginAs(page, sellerEmail!, password!, "seller");

    for (const route of sellerRoutes) {
      await assertNoServerErrors(page, route);
      expect(new URL(page.url()).pathname).not.toBe("/auth");
      if (route === "/seller") {
        await expect(page).toHaveURL(/\/seller\/dashboard(?:\/|$)/);
      }
    }
  });
});
