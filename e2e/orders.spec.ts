import { expect, test } from "@playwright/test";
import { assertNoServerErrors, loginAs, requiredCredential, requiredPassword } from "./helpers/session";

const buyerEmail = requiredCredential("buyer");
const password = requiredPassword("buyer");

test("buyer order list and any visible order detail use owned routes", async ({ page }) => {
  test.skip(!buyerEmail || !password, "ANTIFAKE_UAT_BUYER_EMAIL and ANTIFAKE_UAT_BUYER_PASSWORD are required");
  await loginAs(page, buyerEmail!, password!, "buyer");
  await assertNoServerErrors(page, "/profile/orders");

  const orderLinks = page.locator('a[href^="/profile/orders/"]');
  if (await orderLinks.count()) {
    const href = await orderLinks.first().getAttribute("href");
    expect(href).toMatch(/^\/profile\/orders\/[^/]+$/);
    await assertNoServerErrors(page, href!);
  }
});
