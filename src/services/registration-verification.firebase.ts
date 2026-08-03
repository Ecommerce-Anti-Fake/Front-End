import {
  PhoneAuthProvider,
  RecaptchaVerifier,
  applyActionCode,
  linkWithCredential,
  sendEmailVerification,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

export const EMAIL_VERIFICATION_CONTINUE_URL =
  "https://antifake.io.vn/login?verified=true";

export async function sendRegistrationEmailVerification() {
  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth.currentUser);
  await sendEmailVerification(currentUser, {
    url: EMAIL_VERIFICATION_CONTINUE_URL,
    handleCodeInApp: false,
  });
}

export async function sendRegistrationPhoneOtp(
  phone: string,
  containerId: string,
): Promise<{ verificationId: string; verifier: RecaptchaVerifier }> {
  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth.currentUser);
  const verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    { phoneNumber: toFirebasePhone(phone), session: currentUser },
    verifier,
  );
  return { verificationId, verifier };
}

export async function linkRegistrationPhoneOtp(
  verificationId: string,
  verificationCode: string,
) {
  const auth = getFirebaseAuth();
  const currentUser = requireCurrentUser(auth.currentUser);
  const credential = PhoneAuthProvider.credential(
    verificationId,
    verificationCode,
  );
  try {
    await linkWithCredential(currentUser, credential);
  } catch (error) {
    if (getFirebaseErrorCode(error) !== "auth/provider-already-linked") {
      throw error;
    }
    // The previous link may have succeeded while the backend request failed.
  }
  await currentUser.reload();
  return currentUser.getIdToken(true);
}

export async function applyEmailVerificationActionCode(oobCode: string) {
  await applyActionCode(getFirebaseAuth(), oobCode);
}

export function toFirebasePhone(phone: string) {
  const normalized = phone.replace(/[\s.-]/g, "");
  if (/^0\d{9}$/.test(normalized)) return `+84${normalized.slice(1)}`;
  if (/^\+84\d{9}$/.test(normalized)) return normalized;
  throw new Error("Số điện thoại Việt Nam không hợp lệ");
}

export async function clearTemporaryFirebaseSession() {
  await signOut(getFirebaseAuth()).catch(() => undefined);
}

function requireCurrentUser(currentUser: User | null) {
  if (!currentUser) {
    throw new Error("Phiên Firebase hiện tại không còn hợp lệ");
  }
  return currentUser;
}

function getFirebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}
