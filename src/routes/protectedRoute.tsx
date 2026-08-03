import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUser } from "../ultil/auth";
type Props = {
  children: React.ReactNode;
  roles?: string[];
};

type AuthUser = {
  role?: string;
};

export default function ProtectedRoute({ children, roles = [] }: Props) {
  const location = useLocation();

  const token = getToken();
  const user = getUser() as AuthUser | null;

  if (!token) {
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
