import assert from "node:assert/strict";
import test from "node:test";

import {
  getPayOSCheckoutRoutes,
  getPayOSEmbeddedReturnUrl,
  isAllowedPayOSCheckoutUrl,
  parsePayOSCheckoutMessage,
  parsePayOSReturnQuery,
  parsePayOSCheckoutState,
} from "../src/components/payment/payosCheckoutState.ts";

test("parses PayOS return query fields without trusting unrelated params", () => {
  assert.deepEqual(
    parsePayOSReturnQuery(
      "?code=00&id=link-1&cancel=false&status=PAID&orderCode=123&ignored=secret",
    ),
    {
      code: "00",
      paymentLinkId: "link-1",
      cancelled: false,
      status: "PAID",
      orderCode: "123",
    },
  );
  assert.equal(parsePayOSReturnQuery(""), null);
  assert.equal(
    parsePayOSReturnQuery("?code=00&id=link-1&cancel=true&status=CANCELLED")
      ?.cancelled,
    true,
  );
});

test("accepts only supported HTTPS payOS checkout URLs", () => {
  assert.equal(
    isAllowedPayOSCheckoutUrl(
      "https://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07",
    ),
    true,
  );
  assert.equal(
    isAllowedPayOSCheckoutUrl(
      "https://next.pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07",
    ),
    true,
  );
  assert.equal(
    isAllowedPayOSCheckoutUrl(
      "https://pay.payos.vn.evil.example/web/124c33293c934a85be5b7f8761a27a07",
    ),
    false,
  );
  assert.equal(
    isAllowedPayOSCheckoutUrl(
      "http://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07",
    ),
    false,
  );
  assert.equal(
    isAllowedPayOSCheckoutUrl(
      "https://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07?redirect_uri=https://evil.example",
    ),
    false,
  );
});

test("parses order, user top-up, and shop top-up checkout states", () => {
  const checkoutUrl =
    "https://pay.payos.vn/web/124c33293c934a85be5b7f8761a27a07";
  const paymentLinkId = "124c33293c934a85be5b7f8761a27a07";

  assert.deepEqual(
    parsePayOSCheckoutState({
      flow: "ORDER",
      orderId: "order-1",
      orderCode: 123,
      checkoutUrl,
      paymentLinkId,
      amount: 150000,
    }),
    {
      flow: "ORDER",
      orderId: "order-1",
      orderCode: 123,
      checkoutUrl,
      paymentLinkId,
      amount: 150000,
    },
  );

  assert.deepEqual(
    parsePayOSCheckoutState({
      flow: "USER_WALLET_TOP_UP",
      topUpId: "top-up-1",
      checkoutUrl,
      paymentLinkId,
      amount: "100000.00",
      currency: "VND",
    }),
    {
      flow: "USER_WALLET_TOP_UP",
      topUpId: "top-up-1",
      checkoutUrl,
      paymentLinkId,
      amount: "100000.00",
      currency: "VND",
    },
  );

  assert.deepEqual(
    parsePayOSCheckoutState({
      flow: "SHOP_WALLET_TOP_UP",
      topUpId: "top-up-2",
      shopId: "shop-1",
      checkoutUrl,
      paymentLinkId,
      amount: "250000.00",
      currency: "VND",
    }),
    {
      flow: "SHOP_WALLET_TOP_UP",
      topUpId: "top-up-2",
      shopId: "shop-1",
      checkoutUrl,
      paymentLinkId,
      amount: "250000.00",
      currency: "VND",
    },
  );
});

test("rejects malformed state and mismatched payment link IDs", () => {
  assert.equal(parsePayOSCheckoutState(null), null);
  assert.equal(
    parsePayOSCheckoutState({
      flow: "ORDER",
      orderId: "order-1",
      orderCode: 123,
      checkoutUrl: "https://pay.payos.vn/web/link-1",
      paymentLinkId: "link-2",
      amount: 150000,
    }),
    null,
  );
  assert.equal(
    parsePayOSCheckoutState({
      flow: "USER_WALLET_TOP_UP",
      topUpId: "top-up-1",
      checkoutUrl: "https://pay.payos.vn/web/link-1",
      paymentLinkId: "link-1",
      amount: 0,
      currency: "VND",
    }),
    null,
  );
});

test("uses fixed internal routes for every checkout flow", () => {
  assert.deepEqual(getPayOSCheckoutRoutes("ORDER"), {
    backPath: "/checkout",
    successPath: "/payment-success",
    cancelPath: "/payment-failed",
  });
  assert.deepEqual(getPayOSCheckoutRoutes("USER_WALLET_TOP_UP"), {
    backPath: "/profile/wallet",
    successPath: "/profile/wallet?topUp=returned",
    cancelPath: "/profile/wallet?topUp=cancelled",
  });
  assert.deepEqual(getPayOSCheckoutRoutes("SHOP_WALLET_TOP_UP"), {
    backPath: "/seller/wallet",
    successPath: "/seller/wallet?topUp=returned",
    cancelPath: "/seller/wallet?topUp=cancelled",
  });
});

test("uses the containing payment page as the embedded return URL", () => {
  assert.equal(
    getPayOSEmbeddedReturnUrl("https://antifake.io.vn/"),
    "https://antifake.io.vn/payment",
  );
});

test("accepts only known PayOS embedded callback messages", () => {
  assert.equal(
    parsePayOSCheckoutMessage(
      JSON.stringify({
        type: "payment_response",
        data: { status: "PAID" },
      }),
    ),
    "SUCCESS",
  );
  assert.equal(
    parsePayOSCheckoutMessage({
      type: "payment_response",
      data: { status: "CANCELLED" },
    }),
    "CANCEL",
  );
  assert.equal(
    parsePayOSCheckoutMessage({ type: "error", data: { code: "TIMEOUT" } }),
    "EXIT",
  );
  assert.equal(
    parsePayOSCheckoutMessage({
      type: "payment_response",
      data: { status: "PENDING" },
    }),
    null,
  );
  assert.equal(
    parsePayOSCheckoutMessage({
      type: "payment_response",
      data: { status: "FAILED" },
    }),
    "FAILED",
  );
  assert.equal(parsePayOSCheckoutMessage("not-json"), null);
});
