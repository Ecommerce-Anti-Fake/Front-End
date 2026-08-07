import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";
import { shouldUseGoogleRedirect } from "./google-auth-flow";
import { readCurrentPwaEnvironment } from "./pwa-install";

const GOOGLE_LOGIN_REDIRECT_KEY = "antifake.googleLoginRedirect";
let redirectResultPromise: Promise<UserCredential | null> | null = null;

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export async function beginGoogleLogin(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  const provider = createGoogleProvider();

  if (shouldUseGoogleRedirect(readCurrentPwaEnvironment().platform)) {
    sessionStorage.setItem(GOOGLE_LOGIN_REDIRECT_KEY, "pending");
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      sessionStorage.removeItem(GOOGLE_LOGIN_REDIRECT_KEY);
      throw error;
    }
    return null;
  }

  return signInWithPopup(auth, provider);
}

export function consumeGoogleLoginRedirect(): Promise<UserCredential | null> {
  if (sessionStorage.getItem(GOOGLE_LOGIN_REDIRECT_KEY) !== "pending") {
    return Promise.resolve(null);
  }

  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(getFirebaseAuth()).finally(() => {
      sessionStorage.removeItem(GOOGLE_LOGIN_REDIRECT_KEY);
      redirectResultPromise = null;
    });
  }

  return redirectResultPromise;
}
