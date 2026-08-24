import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("checkout fails closed when the server quote is rejected", async ({ page }) => {
  const baseUrl = process.env.UAT_BASE_URL ?? "";
  test.skip(
    baseUrl.startsWith("https://") || baseUrl.startsWith("http://antifake"),
    "Local mocked checkout regression only",
  );

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "local-test-token");
    localStorage.setItem("user", JSON.stringify({ id: "buyer-1", role: "buyer" }));
    history.replaceState({
      usr: {
        source: "cart",
        shops: [{
          shopId: "shop-1",
          shopName: "Test shop",
          items: [{
            id: "cart-item-1",
            offerId: "offer-1",
            variantId: "variant-1",
            variantSku: "1L-HOP-LE",
            thumbnailUrl: "",
            offerTitleSnapshot: "Test product",
            unitPriceSnapshot: 10000,
            currencySnapshot: "VND",
            quantity: 1,
          }],
        }],
      },
      key: "local-checkout",
      idx: 0,
    }, "", "/checkout");
  });

  await installMockCheckoutFetch(page, {
    quoteStatus: 400,
    quoteBody: { message: "Variant is not available" },
  });
  await page.goto("/checkout", { waitUntil: "networkidle" });

  await expect(page.getByRole("alert")).toHaveText("Variant is not available");
  await expect(page.locator(".summary-total-checkout strong")).toHaveText("—");
  await expect(page.locator("button.checkout-btn")).toBeDisabled();
});

test("checkout enables order submission only after a successful quote", async ({ page }) => {
  const baseUrl = process.env.UAT_BASE_URL ?? "";
  test.skip(
    baseUrl.startsWith("https://") || baseUrl.startsWith("http://antifake"),
    "Local mocked checkout regression only",
  );

  await page.addInitScript(() => {
    localStorage.setItem("accessToken", "local-test-token");
    localStorage.setItem("user", JSON.stringify({ id: "buyer-1", role: "buyer" }));
    history.replaceState({
      usr: {
        source: "cart",
        shops: [{
          shopId: "shop-1",
          shopName: "Test shop",
          items: [{
            id: "cart-item-1",
            offerId: "offer-1",
            variantId: "variant-1",
            variantSku: "1L-HOP-LE",
            thumbnailUrl: "",
            offerTitleSnapshot: "Test product",
            unitPriceSnapshot: 10000,
            currencySnapshot: "VND",
            quantity: 1,
          }],
        }],
      },
      key: "local-checkout-success",
      idx: 0,
    }, "", "/checkout");
  });

  await installMockCheckoutFetch(page, {
    quoteStatus: 200,
    quoteBody: { discountAmount: 0, buyerPayableAmount: 31000 },
  });
  await page.goto("/checkout", { waitUntil: "networkidle" });

  await expect(page.locator(".summary-total-checkout strong")).toHaveText("31.000 VND");
  await expect(page.locator("button.checkout-btn")).toBeEnabled();
});

async function installMockCheckoutFetch(
  page: Page,
  quote: { quoteStatus: number; quoteBody: unknown },
) {
  await page.addInitScript((mockQuote) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();
      const url = new URL(requestUrl, window.location.href);

      if (url.hostname !== "api.antifake.io.vn" || !url.pathname.startsWith("/api/")) {
        return nativeFetch(input, init);
      }

      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });

      if (url.pathname.endsWith("/api/user/addresses/default")) {
        return json(200, {
          id: "address-1",
          recipientName: "Test Buyer",
          phone: "0900000000",
          addressLine: "Test address",
          wardCode: "ward-1",
        });
      }

      if (url.pathname.endsWith("/api/cart/shipping-options")) {
        return json(200, {
          options: [{
            optionCode: "GHN_TEST",
            providerCode: "GHN",
            providerName: "GHN",
            methodName: "Nhanh",
            shippingFee: 21000,
            estimatedDelivery: "Tomorrow",
          }],
        });
      }

      if (url.pathname.endsWith("/api/cart/checkout/quote")) {
        return json(mockQuote.quoteStatus, mockQuote.quoteBody);
      }

      if (url.pathname.endsWith("/api/user/notifications")) {
        return json(200, { items: [], total: 0, unreadCount: 0, unreadChatCount: 0 });
      }

      if (url.pathname.endsWith("/api/cart")) {
        return json(200, { shops: [] });
      }

      return json(200, {});
    };
  }, quote);
}
