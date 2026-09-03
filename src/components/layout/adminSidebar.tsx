import {
  BadgeCheck,
  Banknote,
  BookOpen,
  FileCheck2,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Shapes,
  ShieldCheck,
  TicketPercent,
  Users,
  Wallet,
  } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../../css/components/layout/adminSidebar.css";
import { logout } from "../../services/auth.api";

const adminMenus = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Quản lý người dùng",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "Quản lý đăng ký cửa hàng",
    path: "/admin/shop-registrations",
    icon: ShieldCheck,
  },
  {
    label: "Quản lý đăng ký sản phẩm",
    path: "/admin/product-registrations",
    icon: FileCheck2,
  },
  {
    label: "Quản lý mã giảm giá",
    path: "/admin/vouchers",
    icon: TicketPercent,
  },
  {
    label: "Quản lý danh mục",
    path: "/admin/categories",
    icon: Shapes,
  },
  {
    label: "Yêu cầu rút tiền của shop",
    path: "/admin/withdraw-requests",
    icon: Banknote,
  },
  {
    label: "Ví hệ thống",
    path: "/admin/wallet",
    icon: Wallet,
  },
  {
    label: "Chat",
    path: "/admin/chat",
    icon: MessageSquareText,
  },
  {
    label: "Hướng dẫn",
    path: "/admin/help",
    icon: BookOpen,
  },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-badge">
        <div className="admin-sidebar-badge-icon">
          <BadgeCheck size={20} />
        </div>
        <div>
          <strong>AntiFake Admin</strong>
          <small>Hệ thống giám sát</small>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {adminMenus.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "admin-sidebar-link active" : "admin-sidebar-link"
              }
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button type="button" className="admin-report-btn">
          Tạo báo cáo
        </button>
        <button type="button" className="admin-sidebar-logout" onClick={logout}>
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
