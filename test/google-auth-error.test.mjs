import assert from "node:assert/strict";
import test from "node:test";

import {
  getFirebaseAuthErrorMessage,
  isFirebaseAuthError,
  isSilentGooglePopupCancellation,
} from "../src/services/firebase-auth-error.ts";

test("silently recognizes Google popup cancellation errors", () => {
  assert.equal(
    isSilentGooglePopupCancellation({ code: "auth/popup-closed-by-user" }),
    true,
  );
  assert.equal(
    isSilentGooglePopupCancellation({ code: "auth/cancelled-popup-request" }),
    true,
  );
  assert.equal(
    isSilentGooglePopupCancellation({ code: "auth/popup-blocked" }),
    false,
  );
  assert.equal(
    isFirebaseAuthError({ code: "GOOGLE_ACCOUNT_NOT_LINKED" }),
    false,
  );
});

test("maps blocked Google popup errors to Vietnamese", () => {
  assert.match(
    getFirebaseAuthErrorMessage({ code: "auth/popup-blocked" }, "login"),
    /Trình duyệt đã chặn cửa sổ Google/,
  );
});

test("uses action-specific fallback messages for unknown Firebase errors", () => {
  assert.equal(
    getFirebaseAuthErrorMessage({ code: "auth/unknown" }, "login"),
    "Không thể đăng nhập bằng Google. Vui lòng thử lại.",
  );
  assert.equal(
    getFirebaseAuthErrorMessage({ code: "auth/unknown" }, "register"),
    "Không thể đăng ký bằng Google. Vui lòng thử lại.",
  );
});
