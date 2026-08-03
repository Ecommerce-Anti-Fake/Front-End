import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("UAT_USER_EMAIL");
const password = requiredPassword();

test("buyer chat entry points load without mutating a thread", async ({ page }) => {
  test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, buyerEmail!, password!);
  await assertNoServerErrors(page, "/messages");
  await assertNoServerErrors(page, "/chat");
  expect(new URL(page.url()).pathname).toBe("/chat");
});
