import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "sonner";
import {
  AuthApiError,
  firebaseLogin,
  login,
  type RegistrationDetails,
} from "../../services/auth.api";
import { clearTemporaryFirebaseSession } from "../../services/registration-verification.firebase";
import { getFirebaseAuth } from "../../services/firebase";
import {
  getFirebaseAuthErrorMessage,
  isFirebaseAuthError,
  isSilentGooglePopupCancellation,
} from "../../services/firebase-auth-error";
import { saveToken, saveUser } from "../../ultil/auth";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import { shouldFallbackToFirebase } from "./login-flow";

type Props = {
  onSwitch: () => void;
  onVerificationRequired: (registration: RegistrationDetails) => void;
  verifiedNotice?: boolean;
};

export default function LoginPage({
  onSwitch,
  onVerificationRequired,
  verifiedNotice = false,
}: Props) {
  const navigate = useNavigate();
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Vui lòng nhập email/SĐT và mật khẩu");
      return;
    }

    setLoading(true);
    showLoading("Đang đăng nhập…");
    try {
      let localLoginError: unknown;
      try {
        const localData = await login({ username: username.trim(), password });
        saveToken(localData.accessToken);
        saveUser(localData.user);
        toast.success("Login thanh cong");
        navigateByRole(localData.user.role);
        return;
      } catch (error) {
        localLoginError = error;
        if (!username.includes("@") || !shouldFallbackToFirebase(error)) {
          throw error;
        }
      }

      if (username.includes("@")) {
        const handledByFirebase = await tryFirebaseEmailLogin(
          username.trim(),
          password,
          onVerificationRequired,
        );
        if (handledByFirebase) return;
        throw localLoginError;
      }

      const data = await login({ username: username.trim(), password });
      saveToken(data.accessToken);
      saveUser(data.user);
      toast.success("Đăng nhập thành công");
      navigateByRole(data.user.role);
    } catch (caught) {
      toast.error(toMessage(caught));
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      showLoading("Đang đăng nhập với Google…");
      const idToken = await credential.user.getIdToken(true);
      const data = await firebaseLogin({ idToken });
      saveToken(data.accessToken);
      saveUser(data.user);
      await clearTemporaryFirebaseSession();
      toast.success("Đăng nhập Google thành công");
      navigateByRole(data.user.role);
    } catch (caught) {
      if (isSilentGooglePopupCancellation(caught)) return;
      if (caught instanceof AuthApiError && caught.code === "GOOGLE_ACCOUNT_NOT_LINKED") {
        toast.info("Tài khoản Google của bạn chưa đăng ký. Vui lòng đăng ký trước.");
        return;
      }
      if (isFirebaseAuthError(caught)) {
        toast.error(getFirebaseAuthErrorMessage(caught, "login"));
      } else {
        toast.error(toMessage(caught));
      }
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const navigateByRole = (role: string) =>
    navigate(role.toLowerCase() === "admin" ? "/admin" : "/");

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src="/brand/logo-antifake.png" alt="AntiFake" />
        </div>
        <h1>Chào mừng trở lại</h1>
        <p className="login-subtitle">Truy cập tài khoản AntiFake của bạn</p>

        {verifiedNotice && (
          <p className="verification-success" role="status" aria-live="polite">
            Xác minh tài khoản thành công. Bạn có thể đăng nhập.
          </p>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="login-username">Email hoặc số điện thoại</label>
          <div className="login-input">
            <User size={18} />
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="login-password-header">
            <label htmlFor="login-password">Mật khẩu</label>
            <button type="button">Quên mật khẩu?</button>
          </div>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            Đăng nhập
          </button>
        </form>

        <div className="login-divider"><span>Hoặc tiếp tục với</span></div>
        <div className="social-buttons">
          <button type="button" onClick={() => void handleGoogleLogin()} disabled={loading}>
            <GoogleMark /> Google
          </button>
        </div>
        <div className="login-register">
          Chưa có tài khoản?
          <button type="button" onClick={onSwitch}>Đăng ký ngay</button>
        </div>
      </div>
    </div>
  );
}

async function tryFirebaseEmailLogin(
  email: string,
  password: string,
  onVerificationRequired: (registration: RegistrationDetails) => void,
) {
  try {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      email,
      password,
    );
    await credential.user.reload();
    const idToken = await credential.user.getIdToken(true);
    const data = await firebaseLogin({ idToken });
    saveToken(data.accessToken);
    saveUser(data.user);
    await clearTemporaryFirebaseSession();
    toast.success("Đăng nhập thành công");
    window.location.assign(data.user.role.toLowerCase() === "admin" ? "/admin" : "/");
    return true;
  } catch (caught) {
    if (caught instanceof AuthApiError && caught.code === "ACCOUNT_VERIFICATION_REQUIRED") {
      if (caught.registration) {
        onVerificationRequired(caught.registration);
        toast.info("Hãy chọn một phương thức để hoàn tất xác minh tài khoản.");
      } else {
        toast.info("Tài khoản chưa được xác minh. Vui lòng đăng ký lại.");
      }
      return true;
    }
    if (caught instanceof AuthApiError && caught.code === "REGISTRATION_EXPIRED") {
      toast.info("Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.");
      return true;
    }
    return false;
  }
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="google-icon">
      <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.51z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.96l3.34-2.58z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.5 3.84 1.5l2.88-2.88C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.34 2.58C7.2 7.74 9.4 5.98 12 5.98z" />
    </svg>
  );
}

function toMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể đăng nhập";
}
