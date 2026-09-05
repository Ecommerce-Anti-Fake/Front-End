import test from "node:test";
import assert from "node:assert/strict";
import {
  assertUatRole,
  assertUatSellerAccount,
  getUatAuthAvailability,
  readUatAuthInput,
} from "../e2e/helpers/uat-auth-contract.ts";
import { getUatStorageStatePath } from "../e2e/helpers/session.ts";

const completeEnvironment = {
  ANTIFAKE_UAT_BUYER_EMAIL: "buyer@antifake.local",
  ANTIFAKE_UAT_BUYER_PASSWORD: "synthetic-buyer-secret",
  ANTIFAKE_UAT_SELLER_EMAIL: "seller@antifake.local",
  ANTIFAKE_UAT_SELLER_PASSWORD: "synthetic-seller-secret",
  ANTIFAKE_UAT_ADMIN_EMAIL: "admin@antifake.io.vn",
  ANTIFAKE_UAT_ADMIN_PASSWORD: "synthetic-admin-secret",
};

test("reads complete role inputs from the explicit AntiFake contract", () => {
  const buyer = readUatAuthInput("buyer", completeEnvironment);
  const seller = readUatAuthInput("seller", completeEnvironment);
  const admin = readUatAuthInput("admin", completeEnvironment);

  assert.equal(buyer?.email, completeEnvironment.ANTIFAKE_UAT_BUYER_EMAIL);
  assert.equal(seller?.email, completeEnvironment.ANTIFAKE_UAT_SELLER_EMAIL);
  assert.equal(admin?.email, completeEnvironment.ANTIFAKE_UAT_ADMIN_EMAIL);
  assert.deepEqual(getUatAuthAvailability(completeEnvironment), {
    buyer: true,
    seller: true,
    admin: true,
  });
});

test("does not fall back to legacy credential variable names", () => {
  const legacyEnvironment = {
    UAT_USER_EMAIL: "legacy@antifake.local",
    UAT_SELLER_EMAIL: "legacy-seller@antifake.local",
    UAT_ADMIN_EMAIL: "admin@antifake.io.vn",
    UAT_TEST_PASSWORD: "legacy-secret",
  };

  assert.equal(readUatAuthInput("buyer", legacyEnvironment), undefined);
  assert.equal(readUatAuthInput("seller", legacyEnvironment), undefined);
  assert.equal(readUatAuthInput("admin", legacyEnvironment), undefined);
  assert.deepEqual(getUatAuthAvailability(legacyEnvironment), {
    buyer: false,
    seller: false,
    admin: false,
  });
});

test("partial role input fails closed without exposing a secret value", () => {
  const environment = {
    ANTIFAKE_UAT_BUYER_EMAIL: "buyer@antifake.local",
  };

  assert.equal(readUatAuthInput("buyer", environment), undefined);
  assert.deepEqual(getUatAuthAvailability(environment), {
    buyer: false,
    seller: false,
    admin: false,
  });
});

test("each role uses a distinct ignored storage-state path", () => {
  const paths = [
    getUatStorageStatePath("buyer", "desktop"),
    getUatStorageStatePath("seller", "desktop"),
    getUatStorageStatePath("admin", "desktop"),
  ];

  assert.equal(new Set(paths).size, 3);
  for (const storagePath of paths) {
    assert.match(storagePath, /[\\/]\.uat-runtime[\\/]auth[\\/]/);
    assert.doesNotMatch(storagePath, /password|secret|@/i);
  }
});

test("role verification rejects a mismatched server role safely", () => {
  assert.throws(
    () => assertUatRole("admin", "buyer"),
    (error) => {
      assert.match(error.message, /buyer role verification failed/i);
      assert.doesNotMatch(error.message, /admin/i);
      return true;
    },
  );
  assert.doesNotThrow(() => assertUatRole("user", "buyer"));
  assert.doesNotThrow(() => assertUatRole("user", "seller"));
  assert.throws(() => assertUatSellerAccount("seller", null), /seller role verification failed/i);
  assert.doesNotThrow(() => assertUatSellerAccount("seller", "synthetic-shop-id"));
  assert.doesNotThrow(() => assertUatRole("admin", "admin"));
});
