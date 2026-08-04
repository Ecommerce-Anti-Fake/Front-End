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

  test("header cart badge follows quantity updates", async ({ page }) => {
    test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
    await loginAs(page, buyerEmail!, password!);
    await page.goto("/cart");

    const cartItems = page.locator(".cart-item");
    await expect(cartItems.first()).toBeVisible();

    const badge = page.locator('a[href="/cart"] .badge');
    await expect(badge).toBeVisible();
    const initialBadgeText = (await badge.textContent())?.trim() ?? "";
    test.skip(initialBadgeText === "99+", "Badge cap prevents an exact quantity assertion");
    const initialBadge = Number(initialBadgeText);
    expect(Number.isFinite(initialBadge)).toBe(true);

    const firstItem = cartItems.first();
    const quantity = firstItem.locator(".cart-qty span");
    const plus = firstItem.locator(".cart-qty button").nth(1);
    const minus = firstItem.locator(".cart-qty button").first();
    const initialQuantity = Number((await quantity.textContent())?.trim());

    await plus.click();
    await expect(quantity).toHaveText(String(initialQuantity + 1));
    await expect(badge).toHaveText(String(initialBadge + 1));

    await minus.click();
    await expect(quantity).toHaveText(String(initialQuantity));
    await expect(badge).toHaveText(String(initialBadge));
  });

  test("empty checkout route does not expose a server error", async ({ page }) => {
    test.skip(!buyerEmail || !password, "UAT_USER_EMAIL and UAT_TEST_PASSWORD are required");
    await loginAs(page, buyerEmail!, password!);
    await assertNoServerErrors(page, "/checkout");
    expect(new URL(page.url()).pathname).toBe("/checkout");
  });
});
