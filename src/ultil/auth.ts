import { toast } from "sonner";
import { refreshToken } from "../services/auth.api";

const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const AUTH_FAILURE_STATUSES = new Set([401, 403]);

let refreshPromise: Promise<string> | null = null;
let sessionExpiredHandled = false;

export const saveToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  sessionExpiredHandled = false;
};

export const getToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const saveUser = (user: unknown) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const isTokenExpired = (token: string) => {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return false;

    const normalizedPayload = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    );
    const payload = JSON.parse(atob(paddedPayload)) as { exp?: unknown };

    return (
      typeof payload.exp === "number" &&
      payload.exp * 1000 <= Date.now() + 5_000
    );
  } catch {
    return false;
  }
};

const getRefreshedToken = () => {
  if (!refreshPromise) {
    refreshPromise = refreshToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const handleExpiredSession = () => {
  removeToken();
  removeUser();

  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;
  toast.error("Phiên đăng nhập đã hết hạn");

  if (window.location.pathname !== "/auth") {
    window.location.assign("/auth");
  }
};

const fetchWithToken = (
  input: RequestInfo,
  init: RequestInit,
  token: string,
) =>
  fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
    },
  });

export const authFetch = async (
  input: RequestInfo,
  init: RequestInit = {},
) => {
  let token = getToken();

  try {
    if (!token || isTokenExpired(token)) {
      token = await getRefreshedToken();
    }
  } catch {
    handleExpiredSession();
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  let response = await fetchWithToken(input, init, token);

  if (!AUTH_FAILURE_STATUSES.has(response.status)) {
    return response;
  }

  try {
    token = await getRefreshedToken();
    response = await fetchWithToken(input, init, token);

    return response;
  } catch {
    handleExpiredSession();
    throw new Error("Phiên đăng nhập đã hết hạn");
  }
};
