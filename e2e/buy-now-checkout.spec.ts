import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });

test("Buy Now loads shipping after the default address and refreshes it when the address changes", async ({ page }) => {
  await installBuyNowCheckoutMocks(page, {
    addresses: [
      {
        id: "address-1",
        recipientName: "Người nhận 1",
        phone: "0900000001",
        addressLine: "Địa chỉ 1",
        wardCode: "ward-1",
        isDefault: true,
      },
      {
        id: "address-2",
        recipientName: "Người nhận 2",
        phone: "0900000002",
        addressLine: "Địa chỉ 2",
        wardCode: "ward-2",
        isDefault: false,
      },
    ],
  });

  await page.goto("/checkout", { waitUntil: "networkidle" });

  await expect(page.locator(".shipping-item").filter({ hasText: "Địa chỉ 1" })).toBeVisible();
  await expect(page.locator(".summary-total-checkout strong")).toHaveText("31.000 VND");

  await page.getByRole("button", { name: "Thay đổi" }).click();
  await page.getByText("Địa chỉ 2").click();
  await page.getByRole("button", { name: "Xác nhận" }).click();

  await expect(page.locator(".shipping-item").filter({ hasText: "Địa chỉ 2" })).toBeVisible();
  await expect(page.locator(".shipping-item").filter({ hasText: "Địa chỉ 1" })).toHaveCount(0);
  await expect(page.locator(".summary-total-checkout strong")).toHaveText("32.000 VND");
});

test("Buy Now remains enterable without an address and asks for it on order", async ({ page }) => {
  await installBuyNowCheckoutMocks(page, { addresses: [] });

  await page.goto("/checkout", { waitUntil: "networkidle" });

  const orderButton = page.getByRole("button", { name: "Đặt hàng" });
  await expect(orderButton).toBeEnabled();
  await orderButton.click();

  await expect(page.getByText("Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng")).toBeVisible();
});

async function installBuyNowCheckoutMocks(
  page: Page,
  input: {
    addresses: Array<{
      id: string;
      recipientName: string;
      phone: string;
      addressLine: string;
      wardCode: string;
      isDefault: boolean;
    }>;
  },
) {
  await page.addInitScript(({ addresses }) => {
    localStorage.setItem("accessToken", "local-test-token");
    localStorage.setItem("user", JSON.stringify({ id: "buyer-1", role: "buyer" }));

    let defaultAddressId = addresses.find((address) => address.isDefault)?.id ?? null;
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
        return json(200, addresses.find((address) => address.id === defaultAddressId) ?? null);
      }

      if (url.pathname.endsWith("/api/user/addresses") && (!init?.method || init.method === "GET")) {
        return json(200, addresses);
      }

      if (url.pathname.includes("/api/user/addresses/") && url.pathname.endsWith("/default")) {
        defaultAddressId = url.pathname.split("/").at(-2) ?? null;
        return json(200, { success: true });
      }

      if (url.pathname.endsWith("/api/offers/buy-now")) {
        const address = addresses.find((item) => item.id === defaultAddressId);
        return json(200, {
          shopId: "shop-1",
          shopName: "Test shop",
          offerId: "offer-1",
          modelName: "Test product",
          variantId: "variant-1",
          quantity: 1,
          price: 10000,
          thumbnailUrl: "",
          shippingOptions: address
            ? [{
                optionCode: "GHN_STANDARD",
                providerCode: "GHN",
                providerName: "GHN",
                methodName: address.addressLine,
                shippingFee: address.id === "address-2" ? 22000 : 21000,
                estimatedDelivery: "Tomorrow",
              }]
            : [],
        });
      }

      if (url.pathname.endsWith("/api/offers/buy-now/quote")) {
        return json(200, {
          discountAmount: 0,
          buyerPayableAmount: defaultAddressId === "address-2" ? 32000 : 31000,
        });
      }

      if (url.pathname.endsWith("/api/user/notifications")) {
        return json(200, { items: [], total: 0, unreadCount: 0, unreadChatCount: 0 });
      }

      return json(200, {});
    };

    history.replaceState({
      usr: {
        source: "buy-now",
        buyNowSelection: { offerId: "offer-1", variantId: "variant-1", quantity: 1 },
        shops: [{
          shopId: "shop-1",
          shopName: "Test shop",
          items: [{
            id: "variant-1",
            thumbnailUrl: "",
            offerTitleSnapshot: "Test product",
            unitPriceSnapshot: 10000,
            currencySnapshot: "VND",
            quantity: 1,
          }],
        }],
      },
      key: "local-buy-now-checkout",
      idx: 0,
    }, "", "/checkout");
  }, input);
}
