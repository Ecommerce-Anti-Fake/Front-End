import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("buyer");
const password = requiredPassword("buyer");

test("buyer chat entry points load without mutating a thread", async ({ page }) => {
  test.skip(!buyerEmail || !password, "ANTIFAKE_UAT_BUYER_EMAIL and ANTIFAKE_UAT_BUYER_PASSWORD are required");
  await loginAs(page, buyerEmail!, password!, "buyer");
  await assertNoServerErrors(page, "/messages");
  await assertNoServerErrors(page, "/chat");
  expect(new URL(page.url()).pathname).toBe("/chat");
});
