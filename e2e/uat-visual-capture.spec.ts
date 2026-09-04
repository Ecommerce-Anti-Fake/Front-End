import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { loginAs } from "./helpers/session";

const password = process.env.UAT_TEST_PASSWORD;
const buyerEmail = process.env.UAT_USER_EMAIL;
const sellerEmail = process.env.UAT_SELLER_EMAIL;
const adminEmail = process.env.UAT_ADMIN_EMAIL;
const qrCode = process.env.UAT_QR_CODE;
const isSyntheticIdentifier = (value: string | undefined) =>
  Boolean(value && /@antifake\.local$/i.test(value));
const isApprovedAdminIdentifier = (value: string | undefined) =>
  Boolean(
    value &&
    (/@antifake\.local$/i.test(value) ||
      value.toLowerCase() === "admin@antifake.io.vn"),
  );
const canRunBuyer =
  process.env.UAT_FIXTURE_SMOKE === "true" &&
  Boolean(password) &&
  isSyntheticIdentifier(buyerEmail);
const canRunSeller =
  process.env.UAT_FIXTURE_SMOKE === "true" &&
  Boolean(password) &&
  isSyntheticIdentifier(sellerEmail);
const canRunAdmin =
  process.env.UAT_FIXTURE_SMOKE === "true" &&
  Boolean(password) &&
  isApprovedAdminIdentifier(adminEmail);
const canRunPublicFixtureCapture = process.env.UAT_FIXTURE_SMOKE === "true";
const canRunQrFixtureCapture =
  process.env.UAT_FIXTURE_SMOKE === "true" && Boolean(qrCode);

type Marker = {
  number: number;
  selector: string;
};

async function findVisibleMarkerTarget(
  page: Page,
  selector: string,
): Promise<Locator> {
  for (const candidateSelector of selector
    .split(",")
    .map((item) => item.trim())) {
    const candidate = page.locator(candidateSelector).first();
    try {
      await expect(candidate).toBeVisible({ timeout: 4000 });
      return candidate;
    } catch {
      // Try the next viewport-specific selector, if one was supplied.
    }
  }

  throw new Error(`Marker target is not visible: ${selector}`);
}

async function visitFixtureRoute(page: Page, route: string) {
  const errors: string[] = [];
  const onResponse = (response: {
    status: () => number;
    url: () => string;
  }) => {
    if (response.status() >= 500) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  };

  page.on("response", onResponse);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toBeEmpty();
  await page
    .waitForLoadState("networkidle", { timeout: 8000 })
    .catch(() => undefined);
  expect(errors, `server errors on ${route}`).toEqual([]);
  page.off("response", onResponse);
}

async function capturePair(
  page: Page,
  testInfo: TestInfo,
  fixtureId: string,
  markers: Marker[],
) {
  const markerTargets: Marker[] = [];
  for (const marker of markers) {
    const locator = await findVisibleMarkerTarget(page, marker.selector).catch(
      () => {
        throw new Error(
          `Marker ${marker.number} target is not visible: ${fixtureId} (${marker.selector})`,
        );
      },
    );
    await expect(
      locator,
      `marker ${marker.number} target ${marker.selector} is required for ${fixtureId}`,
    ).toBeVisible();
    await locator.evaluate((element, number) => {
      element.setAttribute("data-uat-marker-target", String(number));
    }, marker.number);
    markerTargets.push(marker);
  }

  const stem = `uat-${fixtureId}-${testInfo.project.name}`;
  const rawPath = testInfo.outputPath(`${stem}.raw.png`);
  const annotatedPath = testInfo.outputPath(`${stem}.annotated.png`);
  await page.screenshot({ path: rawPath, animations: "disabled" });

  await page.evaluate((items: Marker[]) => {
    for (const item of items) {
      const target = document.querySelector<HTMLElement>(
        `[data-uat-marker-target="${item.number}"]`,
      );
      if (!target) {
        throw new Error(`Marker target disappeared: ${item.number}`);
      }

      target.setAttribute(
        "data-uat-marker-previous-position",
        target.style.position,
      );
      if (getComputedStyle(target).position === "static") {
        target.style.position = "relative";
      }

      const targetRect = target.getBoundingClientRect();
      const markerSize = 28;
      const markerInset = 4;
      const maxLeft = Math.max(
        markerInset,
        targetRect.width - markerSize - markerInset,
      );
      const left = Math.min(
        maxLeft,
        Math.max(markerInset, -targetRect.left + markerInset),
      );

      const marker = document.createElement("span");
      marker.dataset.uatCaptureMarkers = "true";
      marker.textContent = String(item.number);
      Object.assign(marker.style, {
        position: "absolute",
        top: "4px",
        left: `${left}px`,
        width: `${markerSize}px`,
        height: `${markerSize}px`,
        boxSizing: "border-box",
        margin: "0",
        transform: "none",
        display: "grid",
        placeItems: "center",
        border: "3px solid #b91c1c",
        borderRadius: "50%",
        background: "#fff7f6",
        color: "#7f0018",
        font: "800 15px Arial, sans-serif",
        boxShadow: "0 1px 4px rgba(0, 0, 0, .28)",
        zIndex: "2147483647",
        pointerEvents: "none",
      });
      target.append(marker);

      const markerRect = marker.getBoundingClientRect();
      const viewportInset = markerInset;
      const viewportWidth = document.documentElement.clientWidth;
      const correctedLeft = Math.max(
        markerInset,
        Math.min(
          maxLeft,
          left +
            Math.max(0, viewportInset - markerRect.left) -
            Math.max(0, markerRect.right - (viewportWidth - viewportInset)),
        ),
      );
      if (correctedLeft !== left) {
        marker.style.left = `${correctedLeft}px`;
      }
    }
  }, markerTargets);

  try {
    await expect(page.locator('[data-uat-capture-markers="true"]')).toHaveCount(
      markers.length,
    );
    await page.screenshot({ path: annotatedPath, animations: "disabled" });
  } finally {
    await page.evaluate(() => {
      document
        .querySelectorAll('[data-uat-capture-markers="true"]')
        .forEach((marker) => marker.remove());
      document
        .querySelectorAll<HTMLElement>("[data-uat-marker-target]")
        .forEach((target) => {
          target.style.position =
            target.getAttribute("data-uat-marker-previous-position") ?? "";
          target.removeAttribute("data-uat-marker-target");
          target.removeAttribute("data-uat-marker-previous-position");
        });
    });
  }

  const viewport = page.viewportSize();
  console.log(
    JSON.stringify({
      capture: "UAT_DEMO",
      fixtureId,
      route: new URL(page.url()).pathname,
      viewport,
      rawPath,
      annotatedPath,
      markers: markerTargets.map(({ number, selector }) => ({
        number,
        selector,
      })),
    }),
  );
}

test("public Community fixture produces raw and annotated pairs", async ({
  page,
}, testInfo) => {
  test.skip(
    !canRunPublicFixtureCapture,
    "Set UAT_FIXTURE_SMOKE for public UAT fixture capture",
  );
  await visitFixtureRoute(page, "/community");
  await expect(
    page.locator('.community-post:has-text("DOCS_UAT")').first(),
  ).toBeVisible();
  await capturePair(page, testInfo, "community-feed", [
    { number: 1, selector: ".community-content" },
    {
      number: 2,
      selector: '.community-post:has-text("DOCS_UAT") .post-header',
    },
    {
      number: 3,
      selector: '.community-post:has-text("DOCS_UAT") .post-actions',
    },
  ]);
});

test("positive QR fixture produces raw and annotated pairs", async ({
  page,
}, testInfo) => {
  test.skip(
    !canRunQrFixtureCapture,
    "Set UAT_FIXTURE_SMOKE and inject the approved UAT QR code",
  );
  await visitFixtureRoute(page, "/qr");
  await page.getByTestId("verification-tab-code").click();
  await page.getByTestId("verification-code-input").fill(qrCode!);
  await page.getByTestId("verification-submit").click();
  await expect(page.getByTestId("verification-result")).toHaveAttribute(
    "data-status",
    "VERIFIED",
  );
  await capturePair(page, testInfo, "qr-positive", [
    { number: 1, selector: ".qr-header" },
    { number: 2, selector: '[data-testid="verification-result"]' },
    { number: 3, selector: ".qr-result-details" },
  ]);
});

test("scheduled live fixture produces a non-provider room shell pair", async ({
  page,
}, testInfo) => {
  test.skip(
    !canRunPublicFixtureCapture,
    "Set UAT_FIXTURE_SMOKE for public UAT fixture capture",
  );

  const providerRequests: string[] = [];
  const onRequest = (request: { url: () => string }) => {
    const url = request.url();
    const parsedUrl = new URL(url);
    if (
      /(?:\/api)?\/live\/sessions\/[^/]+\/join/i.test(parsedUrl.pathname) ||
      parsedUrl.hostname.endsWith("agora.io")
    ) {
      providerRequests.push(url);
    }
  };
  page.on("request", onRequest);

  try {
    await visitFixtureRoute(page, "/live");
    await page.locator(".live-filter-tabs button").nth(1).click();
    const fixtureCard = page
      .locator('.live-discovery-card:has-text("DOCS_UAT")')
      .first();
    await expect(fixtureCard).toBeVisible();

    await fixtureCard.locator("h2").click();
    await expect(page.locator(".live-room-page")).toBeVisible();
    await expect(page.locator(".live-player-placeholder")).toBeVisible();
    const viewport = page.viewportSize();
    const liveChatSelector =
      viewport && viewport.width <= 390
        ? ".live-chat-bottom .live-chat"
        : ".live-chat-right .live-chat";
    const liveChat = page.locator(liveChatSelector);
    await expect(liveChat).toBeVisible();
    await expect(liveChat.locator(".chat-message").first()).toBeVisible();

    await capturePair(
      page,
      testInfo,
      "live-scheduled-shell",
      viewport && viewport.width <= 390
        ? [
            { number: 1, selector: ".live-session-summary" },
            { number: 2, selector: ".live-session-summary h1" },
            { number: 3, selector: liveChatSelector },
          ]
        : [
            { number: 1, selector: ".live-player" },
            { number: 2, selector: ".live-session-summary" },
            { number: 3, selector: liveChatSelector },
          ],
    );
    expect(providerRequests).toEqual([]);
  } finally {
    page.off("request", onRequest);
  }
});

test.describe("approved UAT demo visual capture scaffold", () => {
  test("buyer fixture pack produces raw and annotated pairs", async ({
    page,
  }, testInfo) => {
    test.skip(
      !canRunBuyer,
      "Set UAT_USER_EMAIL and UAT_TEST_PASSWORD for Buyer capture",
    );
    await loginAs(page, buyerEmail!, password!);

    await visitFixtureRoute(page, "/profile");
    await capturePair(page, testInfo, "buyer-profile", [
      { number: 1, selector: ".profile-header" },
      { number: 2, selector: ".profile-info" },
      { number: 3, selector: ".profile-avatar-section" },
    ]);

    await visitFixtureRoute(page, "/profile/address");
    await capturePair(page, testInfo, "buyer-address", [
      { number: 1, selector: ".profile-address-top" },
      { number: 2, selector: ".profile-address-list" },
      { number: 3, selector: ".profile-address-add-btn" },
    ]);

    await visitFixtureRoute(page, "/profile/orders");
    await capturePair(page, testInfo, "buyer-orders", [
      { number: 1, selector: ".profile-orders-page" },
      { number: 2, selector: ".order-card-user" },
      { number: 3, selector: ".order-detail-btn" },
    ]);
    await (await findVisibleMarkerTarget(page, ".order-detail-btn")).click();
    await expect(page.locator(".order-detail-page")).toBeVisible();
    await capturePair(page, testInfo, "buyer-order-detail", [
      { number: 1, selector: ".od-hero" },
      { number: 2, selector: ".od-info-grid" },
      { number: 3, selector: ".od-payment-card" },
    ]);

    await visitFixtureRoute(page, "/cart");
    await capturePair(page, testInfo, "buyer-cart-voucher", [
      { number: 1, selector: ".cart-header" },
      { number: 2, selector: ".cart-shop" },
      { number: 3, selector: ".cart-summary" },
    ]);

    await visitFixtureRoute(page, "/affiliate");
    await capturePair(page, testInfo, "buyer-affiliate", [
      { number: 1, selector: ".affiliate-center-tabs" },
      { number: 2, selector: ".affiliate-program-overview" },
      { number: 3, selector: ".affiliate-commission-panel" },
    ]);

    await visitFixtureRoute(page, "/profile/wallet");
    await capturePair(page, testInfo, "buyer-wallet", [
      { number: 1, selector: ".wallet-page-heading" },
      { number: 2, selector: ".wallet-user-card" },
      { number: 3, selector: ".wallet-history-card" },
    ]);

    await visitFixtureRoute(page, "/chat");
    await capturePair(page, testInfo, "buyer-chat-history", [
      { number: 1, selector: ".message-sidebar" },
      { number: 2, selector: ".message-room-list" },
      { number: 3, selector: ".message-content" },
    ]);

    await visitFixtureRoute(page, "/community");
    await capturePair(page, testInfo, "buyer-community", [
      { number: 1, selector: ".community-content" },
      { number: 2, selector: ".community-page" },
      { number: 3, selector: ".community-content > *" },
    ]);
  });

  test("seller fixture pack produces raw and annotated pairs", async ({
    page,
  }, testInfo) => {
    test.skip(
      !canRunSeller,
      "Set UAT_SELLER_EMAIL and UAT_TEST_PASSWORD for Seller capture",
    );
    await loginAs(page, sellerEmail!, password!);

    await visitFixtureRoute(page, "/seller/shop-info");
    await capturePair(page, testInfo, "seller-shop", [
      { number: 1, selector: ".seller-shop-info-header" },
      { number: 2, selector: ".seller-shop-info-status" },
      { number: 3, selector: ".seller-shop-info-grid" },
    ]);

    await visitFixtureRoute(page, "/seller/products");
    await capturePair(page, testInfo, "seller-product", [
      { number: 1, selector: ".seller-product-header" },
      { number: 2, selector: ".seller-product-filter" },
      { number: 3, selector: ".seller-product-table-section" },
    ]);

    await visitFixtureRoute(page, "/seller/orders");
    await capturePair(page, testInfo, "seller-orders", [
      { number: 1, selector: ".seller-order-top" },
      { number: 2, selector: ".seller-order-table-card" },
      {
        number: 3,
        selector: ".seller-laptop-orders-table, .seller-mobile-orders-card",
      },
    ]);
    await (
      await findVisibleMarkerTarget(
        page,
        'button[aria-label="Xem chi tiết đơn hàng"]',
      )
    ).click();
    await expect(page.locator(".seller-order-detail")).toBeVisible();
    await capturePair(page, testInfo, "seller-order-detail", [
      { number: 1, selector: ".seller-order-detail-header" },
      { number: 2, selector: ".seller-order-status-card" },
      { number: 3, selector: ".seller-order-summary-card" },
    ]);

    await visitFixtureRoute(page, "/seller/vouchers");
    await capturePair(page, testInfo, "seller-voucher", [
      { number: 1, selector: ".voucher-page-heading" },
      { number: 2, selector: ".voucher-list-card" },
      { number: 3, selector: ".voucher-simple-list" },
    ]);

    await visitFixtureRoute(page, "/seller/wallet");
    await capturePair(page, testInfo, "seller-wallet", [
      { number: 1, selector: ".seller-wallet-top" },
      { number: 2, selector: ".seller-cod-section" },
      { number: 3, selector: ".seller-payout-section" },
    ]);

    await visitFixtureRoute(page, "/seller/affiliate");
    await capturePair(page, testInfo, "seller-affiliate", [
      { number: 1, selector: ".seller-program-panel" },
      { number: 2, selector: ".seller-affiliate-details" },
      {
        number: 3,
        selector: ".seller-affiliate-details .affiliate-panel:last-child",
      },
    ]);

    await visitFixtureRoute(page, "/seller/chat");
    await capturePair(page, testInfo, "seller-chat-history", [
      { number: 1, selector: ".message-sidebar" },
      { number: 2, selector: ".message-room-list" },
      { number: 3, selector: ".message-content" },
    ]);
  });

  test("Admin review pack produces raw and annotated pairs", async ({
    page,
  }, testInfo) => {
    test.skip(
      !canRunAdmin,
      "Set UAT_ADMIN_EMAIL and UAT_TEST_PASSWORD for Admin capture",
    );
    await loginAs(page, adminEmail!, password!);

    const captures: Array<{ id: string; route: string; markers: Marker[] }> = [
      {
        id: "admin-dashboard",
        route: "/admin",
        markers: [
          { number: 1, selector: ".admin-page-heading" },
          { number: 2, selector: ".admin-overview" },
          { number: 3, selector: ".admin-management-grid" },
        ],
      },
      {
        id: "admin-users",
        route: "/admin/users",
        markers: [
          { number: 1, selector: ".admin-page-heading" },
          { number: 2, selector: ".admin-stat-grid" },
          { number: 3, selector: ".admin-table-card" },
        ],
      },
      {
        id: "admin-shop-review",
        route: "/admin/shop-registrations",
        markers: [
          { number: 1, selector: ".admin-page-heading" },
          { number: 2, selector: ".admin-table-toolbar" },
          { number: 3, selector: ".admin-table-wrap" },
        ],
      },
      {
        id: "admin-product-review",
        route: "/admin/product-registrations",
        markers: [
          { number: 1, selector: ".admin-page-heading" },
          { number: 2, selector: ".admin-table-toolbar" },
          { number: 3, selector: ".admin-table-wrap" },
        ],
      },
      {
        id: "admin-vouchers",
        route: "/admin/vouchers",
        markers: [
          { number: 1, selector: ".voucher-page-heading" },
          { number: 2, selector: ".voucher-stat-grid" },
          { number: 3, selector: ".voucher-list-toolbar" },
        ],
      },
      {
        id: "admin-wallet",
        route: "/admin/wallet",
        markers: [
          { number: 1, selector: ".admin-wallet-heading" },
          { number: 2, selector: ".admin-wallet-grid" },
          { number: 3, selector: ".admin-reconcile-card" },
        ],
      },
      {
        id: "admin-withdrawals",
        route: "/admin/withdraw-requests",
        markers: [
          { number: 1, selector: ".admin-withdrawals-heading" },
          { number: 2, selector: ".admin-withdrawal-summary" },
          { number: 3, selector: ".admin-withdrawal-table-card" },
        ],
      },
    ];

    for (const capture of captures) {
      await visitFixtureRoute(page, capture.route);
      await capturePair(page, testInfo, capture.id, capture.markers);
    }
  });
});
