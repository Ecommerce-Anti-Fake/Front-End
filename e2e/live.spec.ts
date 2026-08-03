import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const sellerEmail = requiredCredential("UAT_SELLER_EMAIL");
const password = requiredPassword();

test("guest live discovery loads and links only to live routes", async ({ page }) => {
  await assertNoServerErrors(page, "/live");
  const liveLinks = page.locator('a[href^="/live/"]');
  for (let index = 0; index < await liveLinks.count(); index += 1) {
    expect(await liveLinks.nth(index).getAttribute("href")).toMatch(/^\/live\/[^/]+$/);
  }
});

test("seller live entry point loads without starting a session", async ({ page }) => {
  test.skip(!sellerEmail || !password, "UAT_SELLER_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, sellerEmail!, password!);
  await assertNoServerErrors(page, "/seller/live");
  expect(new URL(page.url()).pathname).not.toBe("/auth");
});
