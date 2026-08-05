import assert from "node:assert/strict";
import test from "node:test";
import { filterSupportedBanks } from "../src/components/wallet/bankPicker.ts";

const banks = [
  {
    bin: "970436",
    code: "VCB",
    name: "Ngân hàng thương mại cổ phần Ngoại thương Việt Nam",
    shortName: "Vietcombank",
    logo: null,
    lookupSupported: true,
  },
  {
    bin: "970415",
    code: "VIETINBANK",
    name: "Ngân hàng TMCP Công Thương Việt Nam",
    shortName: "VietinBank",
    logo: null,
    lookupSupported: true,
  },
];

test("filters banks as the user types by short name or full name", () => {
  assert.deepEqual(
    filterSupportedBanks(banks, "vietcom"),
    [banks[0]],
  );
  assert.deepEqual(
    filterSupportedBanks(banks, "cong thuong"),
    [banks[1]],
  );
});

test("matches bank code and BIN, and keeps all banks for an empty query", () => {
  assert.deepEqual(filterSupportedBanks(banks, "VCB"), [banks[0]]);
  assert.deepEqual(filterSupportedBanks(banks, "970415"), [banks[1]]);
  assert.deepEqual(filterSupportedBanks(banks, ""), banks);
});
