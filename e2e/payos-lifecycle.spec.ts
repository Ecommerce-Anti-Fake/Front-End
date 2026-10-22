import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "block" });
const flows = ["ORDER", "USER_WALLET_TOP_UP", "SHOP_WALLET_TOP_UP"] as const;
for (const flow of flows) {
 test.describe(flow, () => {
  test.beforeEach(async ({ page }) => {
   test.skip(Boolean(process.env.UAT_BASE_URL && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(process.env.UAT_BASE_URL)), "Isolated local mocks only; never issue real PayOS requests");
   await page.addInitScript(() => {
    localStorage.setItem("accessToken", "local-test-token");
    localStorage.setItem("user", JSON.stringify({ id: "buyer-1", role: "buyer" }));
   });
   await page.route("https://*.payos.vn/**", route => route.abort());
  });
  const url = "/payment?flow=" + flow + "&reference=" + (flow === "ORDER" ? "order-1" : "link-1") + (flow === "SHOP_WALLET_TOP_UP" ? "&shopId=shop-1" : "");
  test("server countdown survives refresh, back and reopen; cancel is explicit and reconciled", async ({ page, context }, testInfo) => {
   let status = "PENDING";
   let cancels = 0;
   let cancellationStatus = "PENDING";
   const expiresAt = new Date(Date.now() + 9 * 60000).toISOString();
   const payload = () => ({ orderId: "order-1", orderCode: "AF-1", topUpId: "topup-1", paymentLinkId: "link-1", checkoutUrl: "https://pay.payos.vn/web/link-1", amount: "10000", currency: "VND", status, qrCode: "000201-official-test-payload", expiresAt, serverTime: new Date().toISOString() });
   const handler = async (target: Page) => target.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/orders/mine")) return route.fulfill({ json: [{ id: "order-1", orderCode: "AF-1", status: "pending", paymentStatus: "PENDING", paymentMethod: "PAYOS", totalAmount: 10000 }] });
    if (path.endsWith("/top-ups")) return route.fulfill({ json: [payload()] });
    if (path.endsWith("/wallet/me") || path.endsWith("/shop-1/wallet")) return route.fulfill({ json: { currency: "VND", availableBalance: "0", pendingBalance: "0", lockedBalance: "0", status: "ACTIVE" } });
    if (/payos-payment|top-ups/.test(path)) {
      if (path.endsWith("/cancel")) { cancels++; status = cancellationStatus; }
      return route.fulfill({ json: payload() });
    }
    if (path.endsWith("/shops/mine")) return route.fulfill({ json: [{ id: "shop-1", name: "Test shop", shopStatus: "verified" }] });
    return route.fulfill({ json: [] });
   });
   await handler(page);
   await page.goto(url);
   await expect(page.getByRole("img", { name: "Mã QR thanh toán PayOS" })).toBeVisible();
   await expect(page.locator(".payment-countdown")).toContainText(/0[89]:[0-5][0-9]/);
   for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { name: "Hướng dẫn thanh toán" })).toBeVisible();
    await expect(page.locator(".payment-guide-card li")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Cần hỗ trợ?" })).toBeVisible();
    expect(await page.locator(".payment-guide-card").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(165, 0, 23)");
    const guide = await page.locator(".payment-guide-card").boundingBox();
    const card = await page.locator(".payment-qr-card").boundingBox();
    if (width === 1440) expect(guide!.x).toBeGreaterThan(card!.x + card!.width);
    if (width === 390 || width === 768) expect(guide!.y).toBeGreaterThanOrEqual(card!.y + card!.height);
    const qr = await page.locator(".payment-official-qr svg").boundingBox();
    expect(qr!.width).toBeGreaterThanOrEqual(width === 320 ? 210 : 230);
    expect(qr!.width).toBeLessThanOrEqual(260);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    if (flow === "ORDER") await page.screenshot({ path: testInfo.outputPath("qr-" + width + ".png"), fullPage: true });
   }
   await page.reload();
   await expect(page.locator(".payment-countdown")).toContainText(/0[89]:[0-5][0-9]/);
   await page.getByRole("button", { name: "Quay lại", exact: true }).click();
   expect(cancels).toBe(0);
   await page.getByRole("button", { name: "Tiếp tục thanh toán", exact: true }).click();
   await expect(page.locator(".payment-official-qr")).toBeVisible();
   // Reopening after closing the original tab uses only the durable URL and same backend identity.
   await page.close();
   const reopened = await context.newPage();
   await handler(reopened);
   await reopened.goto(url);
   await expect(reopened.locator(".payment-countdown")).toContainText(/0[89]:[0-5][0-9]/);
   page = reopened;
   await page.getByRole("button", { name: "Hủy thanh toán", exact: true }).click();
   expect(cancels).toBe(0);
   await page.getByRole("button", { name: "Xác nhận hủy thanh toán", exact: true }).click();
   await expect(page.getByText("Thanh toán đã được xác nhận hủy.")).toHaveCount(0);
   await expect(page.locator(".payment-management")).toContainText("Chờ thanh toán");
   cancellationStatus = "PAID"; // Money wins the cancellation race, even at expiry.
   await page.getByRole("button", { name: "Hủy thanh toán", exact: true }).click();
   await page.getByRole("button", { name: "Xác nhận hủy thanh toán", exact: true }).click();
   await expect(page.getByText("Thanh toán thành công. Hệ thống đã xác nhận giao dịch.")).toBeVisible();
   await expect(page.locator(".payment-official-qr")).toHaveCount(0);
   expect(cancels).toBe(2);
  });
  test("embedded callbacks cannot mark paid and manual cancellation needs provider confirmation", async ({ page }) => {
   let status = "PENDING";
   let cancels = 0;
   await page.addInitScript(() => {
    const target = window as unknown as { PayOSCheckout: unknown; testPayOSSuccess: () => void };
    target.PayOSCheckout = { usePayOS: (config: { ELEMENT_ID: string; onSuccess: () => void }) => {
     target.testPayOSSuccess = config.onSuccess;
     return { open: () => { const iframe = document.createElement("iframe"); iframe.src = "about:blank"; document.getElementById(config.ELEMENT_ID)?.append(iframe); }, exit: () => document.getElementById(config.ELEMENT_ID)?.replaceChildren() };
    } };
   });
   await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/cancel")) { cancels++; status = "CANCELLED"; }
    if (/payos-payment|top-ups/.test(path)) return route.fulfill({ json: { orderCode: "AF-1", topUpId: "topup-1", paymentLinkId: "link-1", checkoutUrl: "https://pay.payos.vn/web/link-1", amount: "10000", status, qrCode: "official-qr", expiresAt: new Date(Date.now() + 900000).toISOString(), serverTime: new Date().toISOString() } });
    if (path.endsWith("/shops/mine")) return route.fulfill({ json: [{ id: "shop-1", name: "Test shop", shopStatus: "verified" }] });
    return route.fulfill({ json: [] });
   });
   await page.goto(url);
   await page.getByRole("button", { name: "Mở biểu mẫu PayOS" }).click();
   await expect(page.locator("#payos-checkout-frame iframe")).toBeVisible();
   await page.evaluate(() => (window as unknown as { testPayOSSuccess: () => void }).testPayOSSuccess());
   await expect(page.locator(".payment-management")).toContainText("Chờ thanh toán");
   await expect(page.getByText("Thanh toán thành công. Hệ thống đã xác nhận giao dịch.")).toHaveCount(0);
   await page.getByRole("button", { name: "Hiển thị QR lớn" }).click();
   await page.getByRole("button", { name: "Hủy thanh toán", exact: true }).click();
   expect(cancels).toBe(0);
   await page.getByRole("button", { name: "Xác nhận hủy thanh toán", exact: true }).click();
   await expect(page.getByText("Thanh toán đã được xác nhận hủy.")).toBeVisible();
   await expect(page.locator(".payment-official-qr")).toHaveCount(0);
   if (flow === "ORDER") await expect(page.getByRole("button", { name: "Tạo yêu cầu thanh toán mới" })).toHaveCount(0);
  });
  test("server terminal statuses remain authoritative after the original deadline", async ({ page }) => {
   let status = "CANCELLED";
   await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (/payos-payment|top-ups/.test(path)) return route.fulfill({ json: {
     orderCode: "AF-1", topUpId: "topup-1", paymentLinkId: "link-1", checkoutUrl: null,
     amount: "10000", status, qrCode: null,
     expiresAt: new Date(Date.now() - 60000).toISOString(), serverTime: new Date().toISOString(),
    } });
    return route.fulfill({ json: [] });
   });
   for (const terminal of ["CANCELLED", "FAILED", "PAID"]) {
    status = terminal;
    await page.goto(url);
    await expect(page.locator(".payment-management")).toContainText(({ CANCELLED: "Đã hủy", FAILED: "Chưa thành công", PAID: "Đã thanh toán" } as Record<string, string>)[terminal]);
    await expect(page.locator(".payment-official-qr")).toHaveCount(0);
    await expect(page.getByText("Mã QR đã hết hạn. Vui lòng tạo yêu cầu thanh toán mới.")).toHaveCount(0);
    if (terminal === "CANCELLED") await expect(page.getByText("Thanh toán đã được xác nhận hủy.")).toBeVisible();
    if (terminal === "FAILED") await expect(page.getByText("Thanh toán chưa thành công.")).toBeVisible();
    if (terminal === "PAID") await expect(page.getByText("Thanh toán thành công. Hệ thống đã xác nhận giao dịch.")).toBeVisible();
   }
  });
  test("deadline hides QR online/offline, retry is deliberate; server paid overrides expired display", async ({ page }) => {
   let status = "PENDING";
   let expiresAt = new Date(Date.now() + 2400).toISOString();
   let retries = 0;
   await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (/retry-payos-payment/.test(path)) { retries++; status = "PENDING"; expiresAt = new Date(Date.now() + 900000).toISOString(); }
    if (/payos-payment|top-ups/.test(path)) return route.fulfill({ json: { orderCode: "AF-1", topUpId: "topup-1", paymentLinkId: retries ? "link-2" : "link-1", checkoutUrl: "https://pay.payos.vn/web/" + (retries ? "link-2" : "link-1"), amount: "10000", status, qrCode: "official-qr", expiresAt, serverTime: new Date().toISOString() } });
    if (path.endsWith("/shops/mine")) return route.fulfill({ json: [{ id: "shop-1", name: "Test shop", shopStatus: "verified" }] });
    return route.fulfill({ json: [] });
   });
   await page.goto(url);
   await expect(page.locator(".payment-official-qr")).toBeVisible();
   await expect(page.getByText("Mã QR đã hết hạn. Vui lòng tạo yêu cầu thanh toán mới.")).toBeVisible({ timeout: 7000 });
   await expect(page.locator(".payment-official-qr")).toHaveCount(0);
   expect(retries).toBe(0);
   status = "EXPIRED";
   await page.reload();
   await expect(page.getByText("Mã QR đã hết hạn. Vui lòng tạo yêu cầu thanh toán mới.")).toBeVisible();
   if (flow === "ORDER") {
    await page.getByRole("button", { name: "Tạo yêu cầu thanh toán mới" }).click();
    await expect(page.locator(".payment-official-qr")).toBeVisible();
    expect(retries).toBe(1);
   } else {
    await page.getByRole("button", { name: "Tạo yêu cầu thanh toán mới" }).click();
    await expect(page).toHaveURL(new RegExp(flow === "USER_WALLET_TOP_UP" ? "/profile/wallet" : "/seller/wallet"));
    expect(retries).toBe(0);
    await page.goto(url);
   }
   status = "PAID";
   await page.getByRole("button", { name: "Kiểm tra trạng thái" }).click();
   await expect(page.getByText("Thanh toán thành công. Hệ thống đã xác nhận giao dịch.")).toBeVisible();
   await expect(page.getByText("Mã QR đã hết hạn. Vui lòng tạo yêu cầu thanh toán mới.")).toHaveCount(0);
  });
 });
}
