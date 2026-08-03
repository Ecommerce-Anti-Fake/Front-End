import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const affiliateEmail = requiredCredential("UAT_AFFILIATE_EMAIL");
const password = requiredPassword();

test("guest affiliate attribution link remains non-blocking", async ({ page }) => {
  await assertNoServerErrors(page, "/?aff=AFK00001");
  expect(new URL(page.url()).pathname).toBe("/");
});

test("affiliate dashboard loads for the configured seed user", async ({ page }) => {
  test.skip(!affiliateEmail || !password, "UAT_AFFILIATE_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, affiliateEmail!, password!);
  await assertNoServerErrors(page, "/affiliate");
  expect(new URL(page.url()).pathname).not.toBe("/auth");
});
