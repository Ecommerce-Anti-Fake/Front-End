import { expect, test, type Page } from "@playwright/test";

async function seedRole(page: Page, role: "admin" | "buyer" | "seller" | "affiliate") {
  await page.addInitScript((userRole) => {
    localStorage.setItem("accessToken", "test.token.value");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "uat-user",
        email: `${userRole}@example.test`,
        role: userRole,
        accountStatus: "ACTIVE",
      }),
    );
  }, role);
}

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

  test("article route opens a journey overview before step one", async ({ page }) => {
    await page.goto("/help/buyer/first-purchase");

    await expect(page.getByTestId("help-overview")).toBeVisible();
    await expect(page.getByTestId("help-overview-start")).toHaveAttribute(
      "href",
      "/help/buyer/first-purchase/discover",
    );
  });

  test("uses the mobile guide when the viewport is mobile and allows override", async ({ page }) => {
    test.skip(page.viewportSize?.width !== 390, "mobile project only");
    await page.goto("/help/buyer/first-purchase/add-to-cart");

    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Mobile");
    await expect(page.getByRole("heading", { name: "Thêm sản phẩm vào giỏ", level: 2 })).toBeVisible();

    await page.getByRole("button", { name: "Desktop" }).click();
    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Desktop");
  });

  test("preserves a manual platform choice across reload", async ({ page }) => {
    await page.goto("/help/buyer/discover/search");

    await page.getByRole("button", { name: "Mobile" }).click();
    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Mobile");

    await page.reload();
    await expect(page.getByTestId("help-platform-label")).toHaveText("Hướng dẫn Mobile");
  });

  test("renders the registered visual for the selected platform", async ({ page }) => {
    await page.goto("/help/buyer/discover/search");

    const platformLabel = await page.getByTestId("help-platform-label").textContent();
    const platform = platformLabel?.includes("Mobile") ? "mobile" : "desktop";
    const visual = page.getByRole("img", { name: /catalog/i });
    await expect(visual).toBeVisible();
    await expect(visual).toHaveAttribute("src", new RegExp(`b02-discovery-${platform}\\.png$`));
  });

  test("renders the B04 cart visual for the selected platform", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    await page.goto("/help/buyer/first-purchase/cart");

    await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute(
      "src",
      new RegExp(`b04-cart-${platform}\\.png$`),
    );
  });

  test("renders the QR entry and code-entry visuals for the selected platform", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    const expected = [
      ["/help/qr/verify-product/open", `b03-open-${platform}.png`],
      ["/help/qr/verify-product/enter-code", `b03-enter-code-${platform}.png`],
    ] as const;

    for (const [route, asset] of expected) {
      await page.goto(route);
      await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute("src", new RegExp(`${asset}$`));
      await expect(page.getByText("Vị trí cần chú ý trên ảnh")).toBeVisible();
    }
  });

  test("renders the local B04 and Admin reuse bindings", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    const publicBindings = [
      ["/help/buyer/first-purchase/discover", `b02-discovery-${platform}.png`],
      ["/help/buyer/first-purchase/product-detail", `b02-product-detail-${platform}.png`],
    ] as const;

    for (const [route, asset] of publicBindings) {
      await page.goto(route);
      await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute("src", new RegExp(`${asset}$`));
    }

    await seedRole(page, "admin");
    const adminBindings = [
      ["/admin/help/admin/admin-review/dashboard", `admin-dashboard-${platform}.png`],
      ["/admin/help/admin/admin-review/product-review", `admin-product-review-${platform}.png`],
      ["/admin/help/admin/operations/dashboard", `admin-dashboard-${platform}.png`],
    ] as const;

    for (const [route, asset] of adminBindings) {
      await page.goto(route);
      await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute("src", new RegExp(`${asset}$`));
    }
  });

  test("renders the accepted Admin visuals for the selected platform", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    await seedRole(page, "admin");
    const expected = [
      ["/admin/help/admin/admin-product-review/pending", `admin-product-review-${platform}.png`],
      ["/admin/help/admin/admin-promotions/list", `admin-promotions-${platform}.png`],
    ] as const;

    for (const [route, asset] of expected) {
      await page.goto(route);
      await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute("src", new RegExp(`${asset}$`));
    }
  });

  test("keeps Admin Help out of the public catalog and deep links", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("button", { name: "Quản trị viên" })).toHaveCount(0);
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Tìm trong hướng dẫn" }).fill("Admin Dashboard");
    await expect(page.getByRole("status")).toContainText("Chưa có bài phù hợp");

    await page.goto("/help/admin/admin-dashboard");
    await expect(page.getByText("Admin Dashboard")).toHaveCount(0);
  });

  test("denies guest access to Admin Help", async ({ page }) => {
    await page.route("**/api/auth/refresh", (route) =>
      route.fulfill({ status: 401, contentType: "application/json", body: "{}" }),
    );
    await page.goto("/admin/help");
    await expect(page).toHaveURL(/\/auth$/);
  });

  test("denies buyer access to Admin Help", async ({ page }) => {
    await seedRole(page, "buyer");
    await page.goto("/admin/help");
    await expect(page).toHaveURL(/\/$/);
  });

  test("denies seller access to Admin Help", async ({ page }) => {
    await seedRole(page, "seller");
    await page.goto("/admin/help");
    await expect(page).toHaveURL(/\/$/);
  });

  test("denies affiliate access to Admin Help", async ({ page }) => {
    await seedRole(page, "affiliate");
    await page.goto("/admin/help");
    await expect(page).toHaveURL(/\/$/);
  });

  test("renders Admin Help inside the protected Admin shell", async ({ page }) => {
    await seedRole(page, "admin");
    await page.goto("/admin/help");

    await expect(page.getByRole("heading", { name: "Hướng dẫn vận hành Admin", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hướng dẫn", exact: true })).toHaveAttribute(
      "href",
      "/admin/help",
    );
    await expect(page.getByRole("link", { name: "Trợ giúp" })).toHaveAttribute("href", "/admin/help");

    await page.locator('a[href="/admin/help/admin/admin-dashboard"]').first().click();
    await expect(page).toHaveURL(/\/admin\/help\/admin\/admin-dashboard$/);
    await expect(page.getByRole("heading", { name: "Admin Dashboard", level: 2 })).toBeVisible();
  });

  test("keeps public and Admin Help within the viewport", async ({ page }) => {
    await page.goto("/help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await seedRole(page, "admin");
    await page.goto("/admin/help");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("renders the accepted Affiliate visual for the selected platform", async ({ page }, testInfo) => {
    const platform = testInfo.project.name === "mobile" ? "mobile" : "desktop";
    await page.goto("/help/seller/affiliate/program");
    await expect(page.locator('[data-testid="help-visual"] img')).toHaveAttribute(
      "src",
      new RegExp(`affiliate-program-${platform}\\.png$`),
    );
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

  test("footer verification help deep-links to the QR journey", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Hướng dẫn xác thực" })).toHaveAttribute(
      "href",
      "/help/qr/verify-product",
    );
  });
});
