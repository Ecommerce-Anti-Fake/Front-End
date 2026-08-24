import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("header badges show the current cart and unread counts", async ({ page }) => {
  await installHeaderMocks(page, { cartQuantity: 3, unreadCount: 5, unreadChatCount: 2 });
  await page.goto("/cart", { waitUntil: "networkidle" });

  await expect(page.locator('a[href="/chat"] .badge')).toHaveText("2");
  await expect(page.locator('a[href="/cart"] .badge')).toHaveText("3");
  await expect(page.locator('a[href="/notification"] .badge')).toHaveText("5");
});

test("header badges stay hidden when there is nothing unread or in the cart", async ({ page }) => {
  await installHeaderMocks(page, { cartQuantity: 0, unreadCount: 0, unreadChatCount: 0 });
  await page.goto("/cart", { waitUntil: "networkidle" });

  await expect(page.locator('a[href="/chat"] .badge')).toHaveCount(0);
  await expect(page.locator('a[href="/cart"] .badge')).toHaveCount(0);
  await expect(page.locator('a[href="/notification"] .badge')).toHaveCount(0);
});

async function installHeaderMocks(
  page: Page,
  counts: { cartQuantity: number; unreadCount: number; unreadChatCount: number },
) {
  await page.addInitScript((mockCounts) => {
    localStorage.setItem("accessToken", "local-test-token");
    localStorage.setItem("user", JSON.stringify({ id: "buyer-1", role: "buyer" }));

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

      if (url.pathname.endsWith("/api/user/notifications")) {
        return new Response(JSON.stringify({
          total: mockCounts.unreadCount,
          unreadCount: mockCounts.unreadCount,
          unreadChatCount: mockCounts.unreadChatCount,
          page: 1,
          pageSize: 100,
          items: [],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname.endsWith("/api/cart")) {
        return new Response(JSON.stringify({
          shops: mockCounts.cartQuantity > 0
            ? [{
                shopId: "shop-1",
                shopName: "Test shop",
                items: [{
                  id: "cart-item-1",
                  offerTitleSnapshot: "Test product",
                  unitPriceSnapshot: 10000,
                  quantity: mockCounts.cartQuantity,
                  thumbnailUrl: "",
                  currencySnapshot: "VND",
                }],
              }]
            : [],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };
  }, counts);
}
