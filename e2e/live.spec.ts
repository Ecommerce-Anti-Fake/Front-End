import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const sellerEmail = requiredCredential("seller");
const password = requiredPassword("seller");

test("guest live discovery loads and links only to live routes", async ({ page }) => {
  await assertNoServerErrors(page, "/live");
  const liveLinks = page.locator('a[href^="/live/"]');
  for (let index = 0; index < await liveLinks.count(); index += 1) {
    expect(await liveLinks.nth(index).getAttribute("href")).toMatch(/^\/live\/[^/]+$/);
  }
});

test("seller live entry point loads without starting a session", async ({ page }) => {
  test.skip(!sellerEmail || !password, "ANTIFAKE_UAT_SELLER_EMAIL and ANTIFAKE_UAT_SELLER_PASSWORD are required");
  await loginAs(page, sellerEmail!, password!, "seller");
  await assertNoServerErrors(page, "/seller/live");
  expect(new URL(page.url()).pathname).not.toBe("/auth");
});
