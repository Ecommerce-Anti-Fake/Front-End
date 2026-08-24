import test from "node:test";
import assert from "node:assert/strict";
import { deriveSellerGettingStartedItems } from "../src/components/dashboard/sellerGettingStartedState.ts";

test("derives a complete seller checklist from authoritative shop data", () => {
  const items = deriveSellerGettingStartedItems({
    shopStatus: "verified",
    offers: [
      { offerStatus: "draft", moderationStatus: "pending" },
      { offerStatus: "inactive", moderationStatus: "approved" },
      { offerStatus: "active", moderationStatus: "approved" },
    ],
    voucherCount: 1,
    totalOrders: 2,
    deliveredOrders: 1,
  });

  assert.equal(items.every((item) => item.complete), true);
});

test("does not claim progress without matching backend state", () => {
  const items = deriveSellerGettingStartedItems({
    shopStatus: "pending_kyc",
    offers: [],
    voucherCount: 0,
    totalOrders: 0,
    deliveredOrders: 0,
  });

  assert.equal(items.some((item) => item.complete), false);
});

test("distinguishes a submitted product from a published product", () => {
  const items = deriveSellerGettingStartedItems({
    shopStatus: "pending_verification",
    offers: [{ offerStatus: "inactive", moderationStatus: "approved" }],
    voucherCount: 0,
    totalOrders: 0,
    deliveredOrders: 0,
  });

  assert.equal(items.find((item) => item.id === "submit-product")?.complete, true);
  assert.equal(items.find((item) => item.id === "publish-product")?.complete, false);
});
