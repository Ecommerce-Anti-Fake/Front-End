import assert from "node:assert/strict";
import test from "node:test";

import { terminateSession } from "../src/services/logout-session.ts";

test("revokes the server session before clearing local authentication", async () => {
  const calls = [];

  await terminateSession({
    revoke: async () => calls.push("revoke"),
    clearLocal: () => calls.push("clear"),
    disconnect: () => calls.push("disconnect"),
    redirect: () => calls.push("redirect"),
  });

  assert.deepEqual(calls, ["revoke", "clear", "disconnect", "redirect"]);
});

test("still clears local authentication when server logout fails", async () => {
  const calls = [];

  await assert.rejects(
    terminateSession({
      revoke: async () => {
        calls.push("revoke");
        throw new Error("offline");
      },
      clearLocal: () => calls.push("clear"),
      disconnect: () => calls.push("disconnect"),
      redirect: () => calls.push("redirect"),
    }),
    /offline/,
  );

  assert.deepEqual(calls, ["revoke", "clear", "disconnect", "redirect"]);
});
