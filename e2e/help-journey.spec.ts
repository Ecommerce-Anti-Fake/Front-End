import { expect, test } from "@playwright/test";

test.describe("Help Center and Journey Center", () => {
  test("shows searchable role journeys and platform controls", async ({ page }) => {
    await page.goto("/help");

    await expect(
      page.getByRole("heading", { name: "Trung tâm trợ giúp AntiFake", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Tìm trong hướng dẫn" })).toBeVisible();
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
