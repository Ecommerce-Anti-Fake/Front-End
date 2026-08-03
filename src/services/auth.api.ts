import { removeToken, removeUser, saveToken, saveUser } from "../ultil/auth";
import { connectSocket } from "./socket";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface RegisterRequest {
  idToken: string;
  phone: string;
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface FirebaseLoginRequest {
  idToken: string;
  displayName?: string;
}

export interface RegistrationDetails {
  provider: "LOCAL" | "GOOGLE";
  purpose?: "REGISTER" | "LINK_GOOGLE" | "VERIFY_PHONE";
  email: string | null;
  phone: string | null;
  expiresAt: string;
}

export interface RegistrationResponse {
  registration: RegistrationDetails;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    displayName: string | null;
    avatar?: string | null;
    role: string;
    accountStatus: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface VerificationChallenge {
  id: string;
  channel: "EMAIL" | "PHONE";
  expiresAt: string;
  resendAt: string;
  state?: string;
}

export class AuthApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly registration?: RegistrationDetails;

  constructor(
    message: string,
    code: string,
    status: number,
    registration?: RegistrationDetails,
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
    this.registration = registration;
  }
}

export const login = async (payload: LoginRequest): Promise<LoginResponse> => {
  const data = await requestJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  connectSocket(data.accessToken);
  return data;
};

export const firebaseLogin = async (
  payload: FirebaseLoginRequest,
): Promise<LoginResponse> => {
  const data = await requestJson<LoginResponse>("/api/auth/firebase-login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  connectSocket(data.accessToken);
  return data;
};

export const register = (payload: RegisterRequest) =>
  requestJson<RegistrationResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const googleRegister = async (idToken: string) => {
  const data = await requestJson<LoginResponse>("/api/auth/google-register", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  connectSocket(data.accessToken);
  return data;
};

export const getRegistrationSession = () =>
  requestJson<RegistrationResponse>("/api/auth/registration-verifications/session");

export const resumeRegistration = (payload: LoginRequest) =>
  requestJson<RegistrationResponse>("/api/auth/registration-verifications/resume", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const createRegistrationChallenge = (channel: "EMAIL" | "PHONE") =>
  requestJson<{ challenge: VerificationChallenge }>("/api/auth/registration-verifications", {
    method: "POST",
    body: JSON.stringify({ channel }),
  });

export const resendRegistrationChallenge = (challengeId: string) =>
  requestJson<{ challenge: VerificationChallenge }>(
    `/api/auth/registration-verifications/${encodeURIComponent(challengeId)}/resend`,
    { method: "POST" },
  );

export const getEmailVerificationContext = (challengeId: string, state: string) =>
  requestJson<{ challengeId: string; email: string; expiresAt: string }>(
    `/api/auth/registration-verifications/email-context?challengeId=${encodeURIComponent(challengeId)}&state=${encodeURIComponent(state)}`,
  );

export const confirmRegistrationChallenge = (
  challengeId: string,
  payload: { idToken: string; state?: string },
) =>
  requestJson<{ success: true; message: string }>(
    `/api/auth/registration-verifications/${encodeURIComponent(challengeId)}/confirm`,
    { method: "POST", body: JSON.stringify(payload) },
  );

export const confirmGoogleLink = (accessToken: string) =>
  requestJson<
    | { success: true; message: string }
    | ({ success: false; verificationRequired: true } & RegistrationResponse)
  >("/api/auth/google-link-intents/confirm", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

export const setLocalCredentials = (
  accessToken: string,
  payload: { idToken: string; phone: string; password: string },
) =>
  requestJson<RegistrationResponse>("/api/auth/local-credentials", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });

export const logout = () => {
  removeToken();
  removeUser();
  connectSocket().disconnect();
  window.location.href = "/";
};

export const refreshToken = async () => {
  const data = await requestJson<LoginResponse>("/api/auth/refresh", { method: "POST" });
  if (!data.accessToken) {
    throw new Error("Phản hồi làm mới token không hợp lệ");
  }
  saveToken(data.accessToken);
  if (data.user) saveUser(data.user);
  connectSocket(data.accessToken);
  return data.accessToken;
};

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(" ")
      : data.message || "Yêu cầu xác thực thất bại";
    throw new AuthApiError(
      message,
      data.code || data.error || "AUTH_REQUEST_FAILED",
      response.status,
      data.registration,
    );
  }
  return (data?.data ?? data) as T;
}
