import assert from "node:assert/strict";
import test from "node:test";
import { buildVietQrPayload } from "../src/ultil/vietQr.ts";

test("builds a VietQR payload with the exact transfer details", () => {
  const payload = buildVietQrPayload({
    bankBin: "970436",
    accountNumber: "0123456789",
    amount: "150000.00",
    transferContent: "AFWD WITHDRAWAL12",
  });

  assert.equal(
    payload,
    "00020101021238540010A00000072701240006970436011001234567890208QRIBFTTA530370454061500005802VN62210817AFWD WITHDRAWAL12630469B7",
  );
});

test("rejects a transfer QR without a valid bank BIN", () => {
  assert.throws(() => buildVietQrPayload({
    bankBin: null,
    accountNumber: "0123456789",
    amount: "150000.00",
    transferContent: "AFWD WITHDRAWAL12",
  }), /mã BIN/);
});
