import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("UAT_USER_EMAIL");
const password = requiredPassword();

test("buyer order list and any visible order detail use owned routes", async ({ page }) => {
  test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
  await loginAs(page, buyerEmail!, password!);
  await assertNoServerErrors(page, "/profile/orders");

  const orderLinks = page.locator('a[href^="/profile/orders/"]');
  if (await orderLinks.count()) {
    const href = await orderLinks.first().getAttribute("href");
    expect(href).toMatch(/^\/profile\/orders\/[^/]+$/);
    await assertNoServerErrors(page, href!);
  }
});
