import { Lock, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { toast } from "sonner";
import {
  googleRegister,
  register,
  type RegistrationDetails,
} from "../../services/auth.api";
import { getFirebaseAuth } from "../../services/firebase";
import { saveToken, saveUser } from "../../ultil/auth";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

type Props = {
  onSwitch: () => void;
  onRegistration: (registration: RegistrationDetails) => void;
  onGoogleRegistered: () => void;
};

export default function RegisterPage({
  onSwitch,
  onRegistration,
  onGoogleRegistered,
}: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registrationRetryAvailable, setRegistrationRetryAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const validate = () => {
    if (displayName.trim().length < 3) return "Họ tên phải có ít nhất 3 ký tự";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email không hợp lệ";
    if (!/^(0\d{9}|\+84\d{9})$/.test(normalizePhone(phone))) return "Số điện thoại không hợp lệ";
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số";
    }
    if (password !== confirmPassword) return "Mật khẩu xác nhận không khớp";
    if (!acceptedTerms) return "Bạn cần đồng ý với điều khoản và chính sách bảo mật";
    return null;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizePhone(phone);
    setLoading(true);
    showLoading(registrationRetryAvailable ? "Đang gửi lại đăng ký…" : "Đang tạo tài khoản Firebase…");
    try {
      const firebaseUser = await ensureEmailPasswordUser(
        normalizedEmail,
        password,
        displayName.trim(),
      );
      const idToken = await firebaseUser.getIdToken(true);
      const result = await register({
        idToken,
        phone: normalizedPhone,
        displayName: displayName.trim(),
      });

      setRegistrationRetryAvailable(false);
      toast.success("Đã tạo phiên đăng ký. Hãy chọn cách xác minh.");
      onRegistration(result.registration);
    } catch (caught) {
      setRegistrationRetryAvailable(Boolean(getFirebaseAuth().currentUser));
      toast.error(toMessage(caught));
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    showLoading("Đang đăng ký với Google…");
    try {
      const credential = await openGooglePopup();
      const idToken = await credential.user.getIdToken(true);
      const result = await googleRegister(idToken);
      saveToken(result.accessToken);
      saveUser(result.user);
      await signOut(getFirebaseAuth()).catch(() => undefined);
      toast.success("Đăng ký Google thành công.");
      onGoogleRegistered();
    } catch (caught) {
      toast.error(toMessage(caught));
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Tạo tài khoản</h1>
        <p className="register-subtitle">
          Đăng ký một lần, xác minh bằng email hoặc số điện thoại.
        </p>

        <form className="register-form" onSubmit={handleRegister}>
          <label htmlFor="register-name">Họ và tên</label>
          <div className="register-input">
            <User size={18} />
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>

          <div className="register-row">
            <div>
              <label htmlFor="register-email">Email</label>
              <div className="register-input">
                <Mail size={18} />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="register-phone">Số điện thoại</label>
              <div className="register-input">
                <Phone size={18} />
                <input
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="register-row">
            <div>
              <label htmlFor="register-password">Mật khẩu</label>
              <div className="register-input">
                <Lock size={18} />
                <input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="register-confirm-password">Nhập lại mật khẩu</label>
              <div className="register-input">
                <ShieldCheck size={18} />
                <input
                  id="register-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
            </div>
          </div>

          <label className="register-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Tôi đồng ý với <b>Điều khoản dịch vụ</b> và <b>Chính sách bảo mật</b>.
            </span>
          </label>

          {registrationRetryAvailable && (
            <p className="verification-hint" role="status">
              Firebase đã tạo tài khoản. Bạn có thể bấm gửi lại để tiếp tục với cùng tài khoản.
            </p>
          )}

          <button type="submit" className="register-btn" disabled={loading}>
            {registrationRetryAvailable ? "Gửi lại đăng ký" : "Đăng ký ngay"}
          </button>
          <div className="login-divider"><span>Hoặc</span></div>
          <button
            type="button"
            className="google-auth-btn"
            onClick={() => void handleGoogleRegister()}
            disabled={loading}
          >
            <GoogleMark /> Đăng ký với Google
          </button>
          <button type="button" onClick={onSwitch}>
            Đã có tài khoản? Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

async function ensureEmailPasswordUser(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  let currentUser = auth.currentUser;

  if (currentUser) {
    const currentEmail = currentUser.email?.trim().toLowerCase();
    const hasPasswordProvider = currentUser.providerData.some(
      (provider) => provider.providerId === "password",
    );
    if (currentEmail !== email || !hasPasswordProvider) {
      await signOut(auth);
      currentUser = null;
    }
  }

  if (!currentUser) {
    try {
      currentUser = (await createUserWithEmailAndPassword(auth, email, password)).user;
    } catch (caught) {
      if (getFirebaseErrorCode(caught) !== "auth/email-already-in-use") throw caught;
      currentUser = (await signInWithEmailAndPassword(auth, email, password)).user;
    }
  }

  await updateProfile(currentUser, { displayName });
  await currentUser.reload();
  return currentUser;
}

async function openGooglePopup() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(getFirebaseAuth(), provider);
}

function normalizePhone(phone: string) {
  const normalized = phone.replace(/[\s.-]/g, "");
  return /^0\d{9}$/.test(normalized)
    ? `+84${normalized.slice(1)}`
    : normalized;
}

function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
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
  return error instanceof Error ? error.message : "Không thể hoàn tất đăng ký";
}
