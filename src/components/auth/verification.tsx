import {
  Clock3,
  Mail,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecaptchaVerifier } from "firebase/auth";
import { toast } from "sonner";
import {
  firebaseLogin,
  type RegistrationDetails,
} from "../../services/auth.api";
import {
  clearTemporaryFirebaseSession,
  linkRegistrationPhoneOtp,
  sendRegistrationEmailVerification,
  sendRegistrationPhoneOtp,
} from "../../services/registration-verification.firebase";
import { saveToken, saveUser } from "../../ultil/auth";

type VerificationStep = "CHOOSE" | "EMAIL_SENT" | "PHONE_OTP";

type Props = {
  registration: RegistrationDetails | null;
  initialChannel?: "EMAIL" | "PHONE";
  completionTarget?: "LOGIN" | "ACCOUNT";
  onVerified: (target: "LOGIN" | "ACCOUNT") => void;
  onBackToLogin: () => void;
};

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegistrationVerification({
  registration,
  initialChannel,
  completionTarget = "LOGIN",
  onVerified,
  onBackToLogin,
}: Props) {
  const [step, setStep] = useState<VerificationStep>(
    initialChannel ? (initialChannel === "PHONE" ? "PHONE_OTP" : "EMAIL_SENT") : "CHOOSE",
  );
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => verifierRef.current?.clear(), []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const startEmailVerification = useCallback(async () => {
    if (!registration?.email || secondsLeft > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendRegistrationEmailVerification();
      setStep("EMAIL_SENT");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      toast.success("Đã gửi email xác minh. Vui lòng kiểm tra hộp thư.");
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [registration, secondsLeft]);

  const startPhoneVerification = useCallback(async () => {
    if (!registration?.phone || secondsLeft > 0) return;
    setLoading(true);
    setError(null);
    try {
      verifierRef.current?.clear();
      const result = await sendRegistrationPhoneOtp(
        registration.phone,
        "registration-recaptcha",
      );
      verifierRef.current = result.verifier;
      setVerificationId(result.verificationId);
      setOtp("");
      setStep("PHONE_OTP");
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      toast.success("Mã OTP đã được gửi tới số điện thoại của bạn.");
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [registration, secondsLeft]);

  const verifyPhoneOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!verificationId || !/^\d{6}$/.test(otp)) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await linkRegistrationPhoneOtp(verificationId, otp);
      const session = await firebaseLogin({ idToken });
      saveToken(session.accessToken);
      saveUser(session.user);
      await clearTemporaryFirebaseSession();
      toast.success("Xác minh số điện thoại thành công.");
      onVerified(completionTarget);
    } catch (caught) {
      setError(toMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <section className="register-card verification-card" aria-labelledby="verification-title">
        <div className="verification-icon" aria-hidden="true">
          <ShieldCheck size={30} />
        </div>
        <h1 id="verification-title">Xác minh tài khoản</h1>

        {!registration && (
          <div className="verification-status" role="alert">
            <p>Phiên đăng ký không còn hợp lệ. Vui lòng đăng ký lại.</p>
          </div>
        )}

        {step === "CHOOSE" && registration && (
          <>
            <p className="register-subtitle">
              Chọn một phương thức xác minh. Bạn không cần nhập lại thông tin.
            </p>
            <div className="verification-options">
              <button type="button" onClick={() => void startEmailVerification()} disabled={loading}>
                <Mail size={22} />
                <span><b>Xác minh bằng email</b><small>{maskEmail(registration.email)}</small></span>
              </button>
              <button type="button" onClick={() => void startPhoneVerification()} disabled={loading}>
                <MessageSquareText size={22} />
                <span><b>Xác minh bằng số điện thoại</b><small>{maskPhone(registration.phone)}</small></span>
              </button>
            </div>
          </>
        )}

        {step === "EMAIL_SENT" && (
          <div className="verification-status" role="status" aria-live="polite">
            <Mail size={36} />
            <h2>Kiểm tra hộp thư của bạn</h2>
            <p>Email xác minh đã được gửi tới {maskEmail(registration?.email ?? null)}.</p>
            <p className="verification-hint">
              Sau khi bấm link, hãy quay lại trang đăng nhập và đăng nhập lại để hệ thống xác minh token mới.
            </p>
            <button
              type="button"
              className="verification-link"
              disabled={loading || secondsLeft > 0}
              onClick={() => void startEmailVerification()}
            >
              {secondsLeft > 0 ? `Gửi lại sau ${formatCountdown(secondsLeft)}` : "Gửi lại email"}
            </button>
          </div>
        )}

        {step === "PHONE_OTP" && (
          <form className="verification-status" onSubmit={verifyPhoneOtp}>
            <MessageSquareText size={36} />
            <h2>Nhập mã OTP 6 số</h2>
            <p>Mã đã gửi tới {maskPhone(registration?.phone ?? null)}</p>
            <input
              className="otp-input"
              aria-label="Mã OTP gồm 6 số"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
            />
            <div className="otp-timer" role="timer">
              <Clock3 size={16} />
              {secondsLeft > 0 ? `Có thể gửi lại sau ${formatCountdown(secondsLeft)}` : "Có thể gửi lại mã"}
            </div>
            <button className="register-btn" type="submit" disabled={loading || otp.length !== 6}>
              Xác minh
            </button>
            <button
              type="button"
              className="verification-link"
              disabled={loading || secondsLeft > 0}
              onClick={() => void startPhoneVerification()}
            >
              Gửi lại mã OTP
            </button>
          </form>
        )}

        {error && <p className="verification-error" role="alert">{error}</p>}
        <button type="button" className="verification-link" onClick={onBackToLogin}>
          Quay về đăng nhập
        </button>
        <div id="registration-recaptcha" />
      </section>
    </div>
  );
}

function formatCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function maskEmail(email: string | null) {
  if (!email) return "email đã đăng ký";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string | null) {
  if (!phone) return "số điện thoại đã đăng ký";
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể hoàn tất xác minh";
}
