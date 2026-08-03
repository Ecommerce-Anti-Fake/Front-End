import { useEffect, useState } from "react";
import {
  applyEmailVerificationActionCode,
  EMAIL_VERIFICATION_CONTINUE_URL,
} from "../../services/registration-verification.firebase";

export default function EmailActionPage() {
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("mode") === "verifyEmail" && params.get("oobCode")
      ? "Đang xác minh email…"
      : "Liên kết xác minh không hợp lệ hoặc đã hết hạn.";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");
    if (mode !== "verifyEmail" || !oobCode) {
      return;
    }

    void applyEmailVerificationActionCode(oobCode)
      .then(() => {
        window.location.replace(EMAIL_VERIFICATION_CONTINUE_URL);
      })
      .catch(() => {
        setMessage("Liên kết xác minh không hợp lệ hoặc đã hết hạn.");
      });
  }, []);

  return (
    <main className="login-page">
      <section className="login-card" role="status" aria-live="polite">
        <h1>Xác minh tài khoản</h1>
        <p>{message}</p>
      </section>
    </main>
  );
}
