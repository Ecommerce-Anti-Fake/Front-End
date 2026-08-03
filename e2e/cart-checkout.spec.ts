import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("UAT_USER_EMAIL");
const password = requiredPassword();

test.describe("cart and checkout safe smoke", () => {
  test("buyer cart loads without creating data", async ({ page }) => {
    test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
    await loginAs(page, buyerEmail!, password!);
    await assertNoServerErrors(page, "/cart");
    expect(new URL(page.url()).pathname).toBe("/cart");
  });

  test("empty checkout route does not expose a server error", async ({ page }) => {
    test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
    await loginAs(page, buyerEmail!, password!);
    await assertNoServerErrors(page, "/checkout");
    expect(new URL(page.url()).pathname).toBe("/checkout");
  });
});
