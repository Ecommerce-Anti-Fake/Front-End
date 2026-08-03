export type GoogleAuthAction = "login" | "register";

const SILENT_POPUP_ERROR_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

export function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

export function isFirebaseAuthError(error: unknown): boolean {
  return getFirebaseAuthErrorCode(error)?.startsWith("auth/") === true;
}

export function isSilentGooglePopupCancellation(error: unknown): boolean {
  const code = getFirebaseAuthErrorCode(error);
  return code !== null && SILENT_POPUP_ERROR_CODES.has(code);
}

export function getFirebaseAuthErrorMessage(
  error: unknown,
  action: GoogleAuthAction,
): string {
  switch (getFirebaseAuthErrorCode(error)) {
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ Google. Vui lòng cho phép popup rồi thử lại.";
    case "auth/unauthorized-domain":
      return "Tên miền hiện tại chưa được Firebase cho phép đăng nhập Google.";
    case "auth/account-exists-with-different-credential":
      return "Email này đã được liên kết với phương thức đăng nhập khác.";
    case "auth/network-request-failed":
      return "Không thể kết nối đến Firebase. Vui lòng thử lại.";
    case "auth/too-many-requests":
      return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
    default:
      return action === "login"
        ? "Không thể đăng nhập bằng Google. Vui lòng thử lại."
        : "Không thể đăng ký bằng Google. Vui lòng thử lại.";
  }
}
