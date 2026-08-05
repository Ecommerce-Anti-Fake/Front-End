import assert from "node:assert/strict";
import test from "node:test";
import {
  buildVoucherPayload,
  createInitialVoucherForm,
  validateVoucherForm,
} from "../src/pages/admin/vouchers/form.ts";

function validForm(overrides = {}) {
  return {
    ...createInitialVoucherForm(),
    code: "WELCOME10",
    name: "Ưu đãi chào mừng",
    percentage: "10",
    minOrderAmount: "200000",
    startsAt: "2026-08-05T09:00",
    endsAt: "2026-08-31T23:59",
    ...overrides,
  };
}

test("serializes a percentage voucher with scope and usage limits", () => {
  const payload = buildVoucherPayload(
    validForm({
      maxDiscountAmount: "50000",
      scopeType: "OFFER",
      scopeIds: "offer-1, offer-2\noffer-3",
      totalUsageLimit: "100",
      userUsageLimit: "2",
    }),
  );

  assert.deepEqual(payload, {
    code: "WELCOME10",
    name: "Ưu đãi chào mừng",
    discountType: "PERCENTAGE",
    percentage: 10,
    fixedAmount: null,
    maxDiscountAmount: 50000,
    minOrderAmount: 200000,
    scopeType: "OFFER",
    scopeIds: ["offer-1", "offer-2", "offer-3"],
    totalUsageLimit: 100,
    userUsageLimit: 2,
    startsAt: new Date("2026-08-05T09:00").toISOString(),
    endsAt: new Date("2026-08-31T23:59").toISOString(),
  });
});

test("serializes fixed amount and free-shipping vouchers without irrelevant discount fields", () => {
  const fixed = buildVoucherPayload(validForm({
    discountType: "FIXED_AMOUNT",
    percentage: "15",
    fixedAmount: "75000",
    maxDiscountAmount: "30000",
  }));
  const shipping = buildVoucherPayload(validForm({
    discountType: "FREE_SHIPPING",
    percentage: "15",
    fixedAmount: "75000",
    maxDiscountAmount: "30000",
  }));

  assert.equal(fixed.fixedAmount, 75000);
  assert.equal(fixed.percentage, null);
  assert.equal(fixed.maxDiscountAmount, null);
  assert.equal(shipping.fixedAmount, null);
  assert.equal(shipping.percentage, null);
  assert.equal(shipping.maxDiscountAmount, 30000);
});

test("reports missing required fields and invalid date range", () => {
  const errors = validateVoucherForm(
    validForm({ code: "", endsAt: "2026-08-04T09:00", scopeType: "VARIANT", scopeIds: "" }),
  );

  assert.equal(errors.code, "Nhập mã voucher.");
  assert.equal(errors.endsAt, "Thời gian kết thúc phải sau thời gian bắt đầu.");
  assert.equal(errors.scopeIds, "Nhập ít nhất một mã đối tượng áp dụng.");
});
