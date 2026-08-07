import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingOverlay from "../components/loadingOverlay";
import { refreshToken } from "../services/auth.api";
import { restoreSessionIfNeeded } from "../services/auth-session";
import {
  getToken,
  getUser,
  isTokenExpired,
  removeToken,
  removeUser,
} from "../ultil/auth";
type Props = {
  children: React.ReactNode;
  roles?: string[];
};

type AuthUser = {
  role?: string;
};

const hasUsableAccessToken = () => {
  const token = getToken();
  return Boolean(token && !isTokenExpired(token));
};

export default function ProtectedRoute({ children, roles = [] }: Props) {
  const location = useLocation();
  const [authState, setAuthState] = useState<
    "checking" | "authenticated" | "guest"
  >(() => (hasUsableAccessToken() ? "authenticated" : "checking"));

  useEffect(() => {
    if (authState !== "checking") return;

    let active = true;
    void restoreSessionIfNeeded({
      hasAccessToken: hasUsableAccessToken(),
      refresh: refreshToken,
    }).then((restored) => {
      if (!active) return;
      if (!restored) {
        removeToken();
        removeUser();
      }
      setAuthState(restored ? "authenticated" : "guest");
    });

    return () => {
      active = false;
    };
  }, [authState]);

  if (authState === "checking") {
    return <LoadingOverlay message="Đang khôi phục phiên đăng nhập..." />;
  }

  const token = getToken();
  const user = getUser() as AuthUser | null;

  if (authState === "guest" || !token) {
    return (
      <Navigate
        to="/auth"
        state={{
          from: location.pathname,
        }}
        replace
      />
    );
  }

  if (roles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const hasRequiredRole = Boolean(
      userRole && roles.some((role) => role.toLowerCase() === userRole),
    );

    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
