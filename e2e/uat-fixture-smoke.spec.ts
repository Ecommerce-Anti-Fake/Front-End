import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/session";
import { readUatAuthInput } from "./helpers/uat-auth-contract";

const qrCode = process.env.UAT_QR_CODE;
const buyerAuth = readUatAuthInput("buyer");
const sellerAuth = readUatAuthInput("seller");
const adminAuth = readUatAuthInput("admin");
const fixtureSmokeEnabled = process.env.UAT_FIXTURE_SMOKE === "true";
const canRunBuyer = fixtureSmokeEnabled && Boolean(buyerAuth);
const canRunSeller = fixtureSmokeEnabled && Boolean(sellerAuth);
const canRunAdmin = fixtureSmokeEnabled && Boolean(adminAuth);
const canRunQr = fixtureSmokeEnabled && Boolean(qrCode);

async function visitFixtureRoute(page: Page, route: string) {
  const errors: string[] = [];
  const onResponse = (response: {
    status: () => number;
    url: () => string;
  }) => {
    if (response.status() >= 500)
      errors.push(`${response.status()} ${response.url()}`);
  };
  page.on("response", onResponse);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  await page
    .waitForLoadState("networkidle", { timeout: 5000 })
    .catch(() => undefined);
  expect(errors, `server errors on ${route}`).toEqual([]);
  page.off("response", onResponse);
}

test.describe("approved UAT demo fixture smoke", () => {
  test("buyer profile, address, cart, orders, affiliate, chat and community are backed by UAT fixtures", async ({
    page,
  }) => {
    test.skip(
      !canRunBuyer,
      "Set UAT_FIXTURE_SMOKE and Buyer UAT account variables",
    );
    await loginAs(page, buyerAuth!.email, buyerAuth!.password, "buyer");
    await visitFixtureRoute(page, "/profile");
    await visitFixtureRoute(page, "/profile/address");
    await visitFixtureRoute(page, "/profile/wallet");
    await visitFixtureRoute(page, "/profile/orders");
    await visitFixtureRoute(page, "/affiliate");
    await visitFixtureRoute(page, "/cart");
    await visitFixtureRoute(page, "/chat");
    await visitFixtureRoute(page, "/community");
  });

  test("positive QR uses the UAT database verification result", async ({
    page,
  }) => {
    test.skip(
      !canRunQr,
      "Set UAT_FIXTURE_SMOKE and the injected UAT QR variable",
    );
    await visitFixtureRoute(page, "/qr");
    await page.getByTestId("verification-tab-code").click();
    await page.getByTestId("verification-code-input").fill(qrCode!);
    await page.getByTestId("verification-submit").click();
    await expect(page.getByTestId("verification-result")).toHaveAttribute(
      "data-status",
      "VERIFIED",
    );
  });

  test("seller shop, product, order, voucher, wallet, affiliate and chat surfaces load from the shared graph", async ({
    page,
  }) => {
    test.skip(
      !canRunSeller,
      "Set UAT_FIXTURE_SMOKE and Seller UAT account variables",
    );
    await loginAs(page, sellerAuth!.email, sellerAuth!.password, "seller");
    await visitFixtureRoute(page, "/seller/shop-info");
    await visitFixtureRoute(page, "/seller/products");
    await visitFixtureRoute(page, "/seller/orders");
    await visitFixtureRoute(page, "/seller/vouchers");
    await visitFixtureRoute(page, "/seller/wallet");
    await visitFixtureRoute(page, "/seller/affiliate");
    await visitFixtureRoute(page, "/seller/chat");
  });

  test("Admin review queues load synthetic records", async ({ page }) => {
    test.skip(
      !canRunAdmin,
      "Set UAT_FIXTURE_SMOKE and Admin UAT account variables",
    );
    await loginAs(page, adminAuth!.email, adminAuth!.password, "admin");
    await visitFixtureRoute(page, "/admin");
    await visitFixtureRoute(page, "/admin/users");
    await visitFixtureRoute(page, "/admin/shop-registrations");
    await visitFixtureRoute(page, "/admin/product-registrations");
    await visitFixtureRoute(page, "/admin/vouchers");
    await visitFixtureRoute(page, "/admin/wallet");
    await visitFixtureRoute(page, "/admin/withdraw-requests");
  });
});
