import assert from "node:assert/strict";
import test from "node:test";

import { isRemoteLogoutEvent } from "../src/services/auth-sync.ts";

test("recognizes access-token removal from another browsing context", () => {
  assert.equal(isRemoteLogoutEvent({ key: "accessToken", newValue: null }), true);
  assert.equal(isRemoteLogoutEvent({ key: "accessToken", newValue: "next-token" }), false);
  assert.equal(isRemoteLogoutEvent({ key: "user", newValue: null }), false);
});
