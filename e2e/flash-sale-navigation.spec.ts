import { expect, test } from "@playwright/test";

test("Flash Sale product opens its detail page", async ({ page }) => {
  await page.route(/\/api\/offers\?/, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            id: "flash-offer-1",
            title: "Flash Sale test product",
            price: 99000,
            currency: "VND",
            thumbnailUrl: "https://example.com/flash-sale.jpg",
            soldQuantity: 2,
            availableQuantity: 8,
            categoryName: "Đồ uống",
            salesMode: "RETAIL",
            verificationLevel: "verified",
            offerStatus: "active",
            brandId: "brand-1",
            shopId: "shop-1",
          },
        ],
      }),
    });
  });
  await page.route(/\/api\/shops\?/, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [] }) });
  });
  await page.route(/\/api\/live\/sessions\?/, async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.goto("/");

  const flashCard = page.locator(".flash-card").first();
  await expect(flashCard).toBeVisible();

  await flashCard.click();

  await expect(page).toHaveURL(/\/product\/flash-offer-1$/);
});
