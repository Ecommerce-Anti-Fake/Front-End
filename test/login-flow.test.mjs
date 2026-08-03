import test from "node:test";
import assert from "node:assert/strict";
import { shouldFallbackToFirebase } from "../src/components/auth/login-flow.ts";

test("local DB verification failures do not fallback to Firebase", () => {
  assert.equal(
    shouldFallbackToFirebase(
      { name: "AuthApiError", code: "EMAIL_NOT_VERIFIED", status: 403 },
    ),
    false,
  );
});

test("Firebase is only a fallback after local credentials are rejected", () => {
  assert.equal(
    shouldFallbackToFirebase(
      { name: "AuthApiError", code: "Unauthorized", status: 401 },
    ),
    true,
  );
});
