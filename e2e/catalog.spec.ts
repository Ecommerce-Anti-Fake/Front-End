import { expect, test, type Page } from "@playwright/test";

function captureServerErrors(page: Page) {
  const errors: string[] = [];
  page.on("response", (response: { status: () => number; url: () => string }) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

test("guest can open a public product from the home catalog", async ({ page }) => {
  const errors = await captureServerErrors(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const product = page.locator('a[href^="/product/"]').first();
  if (!(await product.count())) {
    test.skip(process.env.UAT_REQUIRE_CATALOG_DATA !== "true", "catalog fixture unavailable in this environment");
  }
  await expect(product).toBeVisible({ timeout: 15000 });
  await product.click();
  await expect(page).toHaveURL(/\/product\/[^/]+$/);
  expect(errors).toEqual([]);
});

test("guest can open a public shop from the home catalog", async ({ page }) => {
  const errors = await captureServerErrors(page);
  await page.goto("/", { waitUntil: "networkidle" });
  const shop = page.locator(".shop-info").first();
  if (!(await shop.count())) {
    test.skip(process.env.UAT_REQUIRE_CATALOG_DATA !== "true", "shop fixture unavailable in this environment");
  }
  await expect(shop).toBeVisible({ timeout: 15000 });
  await shop.click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  expect(errors).toEqual([]);
});

test("shop detail renders a branded fallback when no banner is available", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const shop = page.locator(".shop-info").first();
  if (!(await shop.count())) {
    test.skip(process.env.UAT_REQUIRE_CATALOG_DATA !== "true", "shop fixture unavailable in this environment");
  }
  await shop.click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  await expect(page.locator(".shop-header-card-view")).toBeVisible({ timeout: 15000 });
  const banner = page.locator(".shop-banner");
  await expect(banner).toBeVisible({ timeout: 15000 });
  const bannerImage = banner.locator("img");
  if (!(await bannerImage.count())) {
    await expect(banner).toHaveClass(/shop-banner-fallback/);
  }
});

test("guest category selection navigates to filtered search", async ({ page }) => {
  const errors = await captureServerErrors(page);
  await page.goto("/categories", { waitUntil: "networkidle" });
  const category = page.locator(".category-card").first();
  if (!(await category.count())) {
    test.skip(process.env.UAT_REQUIRE_CATALOG_DATA !== "true", "category fixture unavailable in this environment");
  }
  await expect(category).toBeVisible({ timeout: 15000 });
  await category.click();
  await expect(page).toHaveURL(/\/search\?categoryId=/);
  expect(errors).toEqual([]);
});

test("guest search results render product cards or an explicit empty state", async ({ page }) => {
  const errors = await captureServerErrors(page);
  await page.goto("/search?q=seed", { waitUntil: "networkidle" });
  await expect(page.locator("body")).not.toBeEmpty();
  const cards = page.locator('a[href^="/product/"]');
  const emptyState = page.getByText("Không tìm thấy sản phẩm");
  expect((await cards.count()) > 0 || await emptyState.isVisible()).toBeTruthy();
  expect(errors).toEqual([]);
});
