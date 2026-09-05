import test from "node:test";
import assert from "node:assert/strict";
import {
  buildUatCaptureEnvironment,
  getCredentialAvailability,
  parseDotEnv,
} from "../scripts/run-uat-visual-capture.mjs";

test("parses only dotenv values needed by the local UAT bridge", () => {
  const parsed = parseDotEnv(`
    ANTIFAKE_UAT_BUYER_EMAIL=buyer@antifake.local
    ANTIFAKE_UAT_BUYER_PASSWORD='synthetic-secret'
    UNRELATED_RUNTIME_VALUE=not-forwarded
    # ignored comment
  `);

  assert.equal(parsed.ANTIFAKE_UAT_BUYER_EMAIL, "buyer@antifake.local");
  assert.equal(parsed.ANTIFAKE_UAT_BUYER_PASSWORD, "synthetic-secret");
  assert.equal(parsed.UNRELATED_RUNTIME_VALUE, "not-forwarded");
});

test("local file values fill missing role inputs without overriding injected env", () => {
  const environment = buildUatCaptureEnvironment(
    {
      ANTIFAKE_UAT_BUYER_EMAIL: "injected@antifake.local",
      ANTIFAKE_UAT_BUYER_PASSWORD: "injected-secret",
    },
    {
      ANTIFAKE_UAT_BUYER_EMAIL: "file@antifake.local",
      ANTIFAKE_UAT_BUYER_PASSWORD: "file-secret",
      ANTIFAKE_UAT_SELLER_EMAIL: "seller@antifake.local",
      ANTIFAKE_UAT_SELLER_PASSWORD: "seller-secret",
      UNRELATED_RUNTIME_VALUE: "must-not-be-used-by-the-bridge",
    },
  );

  assert.equal(environment.ANTIFAKE_UAT_BUYER_EMAIL, "injected@antifake.local");
  assert.equal(environment.ANTIFAKE_UAT_SELLER_EMAIL, "seller@antifake.local");
  assert.equal(environment.UNRELATED_RUNTIME_VALUE, undefined);
  assert.deepEqual(getCredentialAvailability(environment), {
    buyer: true,
    seller: true,
    admin: false,
  });
});
