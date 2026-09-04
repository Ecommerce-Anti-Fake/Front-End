import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../css/components/layout/header.css";
import {
  Bell,
  CircleHelp,
  ChevronRight,
  Download,
  Home,
  MessageSquareText,
  ScanLine,
  Search,
  Shapes,
  Radio,
  ShoppingCart,
  User,
  UserCircle2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "../../store/cartStore";
import { getToken } from "../../ultil/auth";
import { useHeaderUnreadCounts } from "../../hooks/useHeaderUnreadCounts";
import { usePwaInstalledStatus } from "../../hooks/usePwaInstall";

export default function Header() {
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    // if (!keyword.trim()) return;

    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const cartCount = useCartStore((state) => state.cartCount);
  const refreshCart = useCartStore((state) => state.refreshCart);
  const { unreadCount, unreadChatCount } = useHeaderUnreadCounts(location.pathname);
  const isPwaInstalled = usePwaInstalledStatus();

  useEffect(() => {
    if (location.pathname === "/auth" || !getToken()) {
      return;
    }

    refreshCart();
  }, [location.pathname, refreshCart]);

  const menus = [
    {
      label: "Trang chủ",
      path: "/",
    },
    {
      label: "Cộng đồng",
      path: "/community",
    },
    {
      label: "Livestream",
      path: "/live",
    },
    {
      label: "Danh mục",
      path: "/categories",
    },
    {
      label: "Xác thực QR",
      path: "/qr",
    },
    {
      label: "Trợ giúp",
      path: "/help",
    },
    ...(!isPwaInstalled
      ? [
          {
            label: "Cài đặt",
            path: "/install",
          },
        ]
      : []),
  ];

  const mobileMenus = [
    {
      label: "Trang chủ",
      path: "/",
      icon: Home,
    },
    {
      label: "Cộng đồng",
      path: "/community",
      icon: Users,
    },
    {
      label: "Live",
      path: "/live",
      icon: Radio,
    },
    {
      label: "QR",
      path: "/qr",
      icon: ScanLine,
    },
    {
      label: "Danh mục",
      path: "/categories",
      icon: Shapes,
    },
    {
      label: "Trợ giúp",
      path: "/help",
      icon: CircleHelp,
    },

    {
      label: "Tôi",
      path: "/profile",
      icon: User,
    },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <Link to="/">
          <img src="/brand/logo-antifake.png" alt="AntiFake" className="logo-img" />
        </Link>
      </div>

      {/* menu */}
      <div className="menu">
        {menus.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`menu-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* search  */}
      <div className="search-box">
        <input
          id="header-search"
          name="search"
          type="text"
          aria-label="Tìm sản phẩm"
          placeholder="Tìm sản phẩm..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button className="search-btn" aria-label="Tìm kiếm" onClick={handleSearch}>
          <Search size={22} />
        </button>
      </div>

      {/* action */}
      <div className="header-actions">
        {/* <Link to="/wishlist" className="icon-btn wishlist-btn">
          <Heart size={22} />

          <span className="badge">4</span>
        </Link> */}
        <Link to="/chat" className="icon-btn" aria-label="Tin nhắn">
          <MessageSquareText size={22} />
          {unreadChatCount > 0 && <span className="badge">{unreadChatCount > 99 ? "99+" : unreadChatCount}</span>}
        </Link>

        <Link to="/cart" className="icon-btn cart-btn" aria-label="Giỏ hàng">
          <ShoppingCart size={22} />
          {cartCount > 0 && <span className="badge">{cartCount > 99 ? "99+" : cartCount}</span>}
        </Link>

        <Link to="/notification" className="icon-btn" aria-label="Thông báo">
          <Bell size={22} />
          {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </Link>

        <div className="divider" />

        <Link to="/profile" className="icon-btn profile-btn" aria-label="Tài khoản">
          <UserCircle2 size={24} />
        </Link>
      </div>

      {!isPwaInstalled && (
        <Link to="/install" className="mobile-install-entry">
          <Download size={16} aria-hidden="true" />
          <span>Cài đặt AntiFake</span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}

      {location.pathname !== "/auth" && (
        <div className="mobile-bottom-nav">
          {mobileMenus.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
              >
                <Icon size={20} />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
