import { expect, test, type Page } from "@playwright/test";
import { loginAs } from "./helpers/session";

const password = process.env.UAT_TEST_PASSWORD;
const buyerEmail = process.env.UAT_USER_EMAIL;
const sellerEmail = process.env.UAT_SELLER_EMAIL;
const adminEmail = process.env.UAT_ADMIN_EMAIL;
const qrCode = process.env.UAT_QR_CODE;
const isSyntheticIdentifier = (value: string | undefined) =>
  Boolean(value && /@antifake\.local$/i.test(value));
const canRun =
  process.env.UAT_FIXTURE_SMOKE === "true" &&
  Boolean(password && qrCode) &&
  [buyerEmail, sellerEmail, adminEmail].every(isSyntheticIdentifier);

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

test.describe("isolated UAT fixture smoke", () => {
  test.skip(
    !canRun,
    "Set UAT_FIXTURE_SMOKE and injected UAT account/QR variables",
  );

  test("buyer profile, address, orders, chat and community are backed by UAT fixtures", async ({
    page,
  }) => {
    await loginAs(page, buyerEmail!, password!);
    await visitFixtureRoute(page, "/profile");
    await visitFixtureRoute(page, "/profile/address");
    await visitFixtureRoute(page, "/profile/orders");
    await visitFixtureRoute(page, "/chat");
    await visitFixtureRoute(page, "/community");
  });

  test("positive QR uses the UAT database verification result", async ({
    page,
  }) => {
    await visitFixtureRoute(page, "/qr");
    await page.getByTestId("verification-tab-code").click();
    await page.getByTestId("verification-code-input").fill(qrCode!);
    await page.getByTestId("verification-submit").click();
    await expect(page.getByTestId("verification-result")).toHaveAttribute(
      "data-status",
      "VERIFIED",
    );
  });

  test("seller shop, product, order and chat surfaces load from the shared graph", async ({
    page,
  }) => {
    await loginAs(page, sellerEmail!, password!);
    await visitFixtureRoute(page, "/seller/shop-info");
    await visitFixtureRoute(page, "/seller/products");
    await visitFixtureRoute(page, "/seller/orders");
    await visitFixtureRoute(page, "/seller/chat");
  });

  test("Admin review queues load synthetic records", async ({ page }) => {
    await loginAs(page, adminEmail!, password!);
    await visitFixtureRoute(page, "/admin");
    await visitFixtureRoute(page, "/admin/users");
    await visitFixtureRoute(page, "/admin/shop-registrations");
    await visitFixtureRoute(page, "/admin/product-registrations");
    await visitFixtureRoute(page, "/admin/vouchers");
    await visitFixtureRoute(page, "/admin/withdraw-requests");
  });
});
