import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseGoogleRedirect } from "../src/services/google-auth-flow.ts";

test("uses redirect authentication on Android and iOS", () => {
  assert.equal(shouldUseGoogleRedirect("android"), true);
  assert.equal(shouldUseGoogleRedirect("ios"), true);
});

test("keeps popup authentication on desktop", () => {
  assert.equal(shouldUseGoogleRedirect("desktop"), false);
});
