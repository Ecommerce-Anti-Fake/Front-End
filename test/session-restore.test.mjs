import test from "node:test";
import assert from "node:assert/strict";
import { restoreSessionIfNeeded } from "../src/services/auth-session.ts";

test("keeps an existing access-token session without refreshing", async () => {
  let refreshCalls = 0;

  const restored = await restoreSessionIfNeeded({
    hasAccessToken: true,
    refresh: async () => {
      refreshCalls += 1;
    },
  });

  assert.equal(restored, true);
  assert.equal(refreshCalls, 0);
});

test("restores a missing access token with the existing refresh flow", async () => {
  const restored = await restoreSessionIfNeeded({
    hasAccessToken: false,
    refresh: async () => {},
  });

  assert.equal(restored, true);
});

test("returns guest state only when refresh fails", async () => {
  const restored = await restoreSessionIfNeeded({
    hasAccessToken: false,
    refresh: async () => {
      throw new Error("refresh session expired");
    },
  });

  assert.equal(restored, false);
});
