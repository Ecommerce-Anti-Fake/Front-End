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

// Deadlines are persisted server values; entering the component never starts a timer.
test("countdown uses server deadline across refresh and handles expiry", async () => {
 const { paymentSecondsRemaining, formatPaymentCountdown } = await import("../src/components/payment/payosCheckoutState.ts");
 const created = Date.parse("2026-10-22T00:00:00Z");
 const expires = "2026-10-22T00:15:00Z";
 assert.equal(paymentSecondsRemaining(expires, created), 900);
 assert.equal(formatPaymentCountdown(paymentSecondsRemaining(expires, created + 73000)), "13:47");
 assert.equal(paymentSecondsRemaining(expires, created + 900000), 0);
 assert.equal(paymentSecondsRemaining(expires, created + 901000), 0);
 assert.equal(paymentSecondsRemaining(undefined, created), null);
 assert.equal(paymentSecondsRemaining("invalid", created), null);
});
test("durable references preserve identity for all flows without inventing links", async () => {
 const { paymentPath, parsePaymentReference, checkoutReference } = await import("../src/components/payment/payosCheckoutState.ts");
 for (const ref of [
  { flow: "ORDER", reference: "order-1" },
  { flow: "USER_WALLET_TOP_UP", reference: "link-1" },
  { flow: "SHOP_WALLET_TOP_UP", reference: "link-2", shopId: "shop-1" },
 ]) {
   const parsed = parsePaymentReference(paymentPath(ref).split("?")[1]);
   assert.equal(parsed.flow, ref.flow); assert.equal(parsed.reference, ref.reference);
   assert.equal(parsed.shopId, ref.shopId);
 }
 assert.equal(parsePaymentReference("?flow=SHOP_WALLET_TOP_UP&reference=x"), null);
 assert.equal(parsePaymentReference("?flow=OTHER&reference=x"), null);
 assert.deepEqual(checkoutReference({ flow: "ORDER", orderId: "o", paymentLinkId: "l" }), { flow: "ORDER", reference: "o" });
});
test("checkout parser retains actual server lifecycle and official QR", () => {
 const state = parsePayOSCheckoutState({ flow: "ORDER", orderId: "o", orderCode: 123, amount: 10000, checkoutUrl: "https://pay.payos.vn/web/link", paymentLinkId: "link", expiresAt: "2026-10-22T00:15:00Z", qrCode: "official-payload", status: "PENDING", serverTime: "2026-10-22T00:01:00Z" });
 assert.equal(state.expiresAt, "2026-10-22T00:15:00Z");
 assert.equal(state.qrCode, "official-payload");
 assert.equal(state.serverTime, "2026-10-22T00:01:00Z");
});

test("embedded provider return is path-only while parent URL retains transaction identity", async () => {
 const { paymentPath, parsePaymentReference } = await import("../src/components/payment/payosCheckoutState.ts");
 for (const ref of [
  { flow: "ORDER", reference: "order-1" },
  { flow: "USER_WALLET_TOP_UP", reference: "link-1" },
  { flow: "SHOP_WALLET_TOP_UP", reference: "link-2", shopId: "shop-1" },
 ]) {
  const parent = new URL(paymentPath(ref), "https://antifake.io.vn");
  const target = getPayOSEmbeddedReturnUrl(parent.href);
  assert.equal(target, "https://antifake.io.vn/payment");
  assert.deepEqual(parsePaymentReference(parent.search), { ...ref, shopId: ref.shopId });
 }
});
