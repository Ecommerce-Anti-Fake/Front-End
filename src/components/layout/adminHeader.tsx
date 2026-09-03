import { Bell, CircleHelp, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import "../../css/components/layout/adminHeader.css";
import { getUser } from "../../ultil/auth";

type AdminUserInfo = {
  displayName?: string;
  email?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  role?: string;
};

const getAvatar = (user: AdminUserInfo | null) =>
  user?.avatar ||
  user?.avatarUrl ||
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80";

export default function AdminHeader() {
  const user = getUser() as AdminUserInfo | null;
  const adminName = user?.displayName || user?.email || "Admin Hệ Thống";
  const avatar = getAvatar(user);

  return (
    <header className="admin-header">
      <div className="logo">
        <Link to="/admin">
          <img src="/brand/logo-antifake.png" alt="AntiFake" className="logo-img" />
        </Link>
      </div>

      <div className="admin-header-actions">
        <button type="button" aria-label="Thông báo">
          <Bell size={18} />
          <span />
        </button>
        <button type="button" aria-label="Cài đặt">
          <Settings size={18} />
        </button>
        <Link className="admin-header-help" to="/admin/help" aria-label="Trợ giúp">
          <CircleHelp size={18} />
        </Link>
        <div className="admin-header-profile">
          <div>
            <strong>{adminName}</strong>
            <small>{user?.role === "admin" ? "Quản trị viên" : "Admin"}</small>
          </div>
          <img src={avatar} alt={adminName} />
        </div>
      </div>
    </header>
  );
}
