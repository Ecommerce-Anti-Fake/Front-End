import { expect, test } from "@playwright/test";

test.describe("Help Center and Journey Center", () => {
  test("shows searchable role journeys and platform controls", async ({ page }) => {
    await page.goto("/help");

    await expect(
      page.getByRole("heading", { name: "Trung tâm trợ giúp AntiFake", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Tìm trong hướng dẫn" })).toHaveAttribute("name", "query");
    await expect(page.getByRole("button", { name: "Người mua" })).toBeVisible();
    await page.getByRole("link", { name: "Mua sản phẩm đầu tiên" }).click();
    await expect(page.getByRole("button", { name: "Desktop" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mobile" })).toBeVisible();
  });

  test("uses the mobile guide when the viewport is mobile and allows override", async ({ page }) => {
    test.skip(page.viewportSize?.width !== 390, "mobile project only");
    await page.goto("/help/buyer/first-purchase/add-to-cart");

    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Mobile");
    await expect(page.getByRole("heading", { name: "Thêm sản phẩm vào giỏ", level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "Desktop" }).click();
    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Desktop");
  });

  test("renders the registered visual for the selected platform", async ({ page }) => {
    await page.goto("/help/buyer/discover/search");

    const platformLabel = await page.getByTestId("help-platform-label").textContent();
    const platform = platformLabel?.includes("Mobile") ? "mobile" : "desktop";
    const visual = page.getByRole("img", { name: /catalog/i });
    await expect(visual).toBeVisible();
    await expect(visual).toHaveAttribute("src", new RegExp(`b02-discovery-${platform}\\.png$`));
  });

  test("renders the accepted Admin visuals for the selected platform", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    const expected = [
      ["/help/admin/admin-product-review/pending", `admin-product-review-${platform}.png`],
      ["/help/admin/admin-promotions/list", `admin-promotions-${platform}.png`],
    ] as const;

    for (const [route, asset] of expected) {
      await page.goto(route);
      await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute("src", new RegExp(`${asset}$`));
    }
  });

  test("keeps pending steps on the evidence placeholder", async ({ page }) => {
    await page.goto("/help/buyer/account-start/profile");

    await expect(page.locator('[data-testid="help-visual"]')).toHaveCount(0);
    await expect(page.locator(".help-visual-placeholder")).toBeVisible();
  });

  test("deep links open the requested journey step", async ({ page }) => {
    await page.goto("/help/seller/process-order/confirm-order");

    await expect(page.getByRole("heading", { name: "Xác nhận đơn hàng", level: 2 })).toBeVisible();
    await expect(page.getByText("Bước 2/6")).toBeVisible();
    await expect(page.getByRole("link", { name: "Trung tâm trợ giúp AntiFake" })).toHaveAttribute(
      "href",
      "/help",
    );
  });

  test("public contextual help links deep-link to the relevant journey", async ({ page }) => {
    await page.goto("/qr");
    await expect(page.getByRole("link", { name: "Hướng dẫn kiểm tra sản phẩm" })).toHaveAttribute(
      "href",
      "/help/qr/verify-product",
    );
  });
});
