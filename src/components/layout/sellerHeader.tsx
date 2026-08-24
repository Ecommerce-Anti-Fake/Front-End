import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  BadgePercent,
  Bell,
  Building2,
  CircleHelp,
  Info,
  MessageSquareText,
  ReceiptText,
  Radio,
  Store,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import "../../css/components/layout/sellerHeader.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSellerShop } from "../../contexts/sellerShopContext";
import type { MyShop } from "../../services/shop.api";
import { useHeaderUnreadCounts } from "../../hooks/useHeaderUnreadCounts";

const getShopAvatar = (shop: MyShop) =>
  shop?.shopAvatar || shop?.avatarUrl || shop?.logoUrl || "";

export default function SellerHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const { shop } = useSellerShop();
  const [menuOpen, setMenuOpen] = useState(false);
  const { unreadCount, unreadChatCount } = useHeaderUnreadCounts(
    location.pathname,
  );

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const avatar = getShopAvatar(shop);
  const shopName = shop?.shopName || "Cửa hàng của tôi";
  const shopInitial = shopName.trim().charAt(0).toUpperCase() || "S";
  const shopInfoItems = [
    {
      label: "Hồ sơ cá nhân",
      icon: UserRound,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Thông tin cửa hàng",
      icon: Store,
      onClick: () => navigate("/seller/shop-info"),
    },
    {
      label: "Thông tin doanh nghiệp",
      icon: Building2,
      onClick: () => navigate("/seller/business-info"),
    },
    {
      label: "Thông tin thuế",
      icon: ReceiptText,
    },
    {
      label: "Hỗ trợ",
      icon: CircleHelp,
      onClick: () => navigate("/help/seller/process-order"),
    },
    {
      label: "Giới thiệu",
      icon: Info,
    },
  ];

  return (
    <header className="seller-header">
      <div className="seller-header-left">
        <div className="logo">
          <Link to="/">
            <img
              src="/brand/logo-antifake.png"
              alt="logo"
              className="logo-img"
            />
          </Link>
        </div>

        <nav className="seller-header-menu">
          <NavLink
            to="dashboard"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="products"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <Package size={18} />
            <span>Sản phẩm</span>
          </NavLink>

          <NavLink
            to="orders"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <ShoppingCart size={18} />
            <span>Đơn hàng</span>
          </NavLink>

          <NavLink
            to="wallet"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <Wallet size={18} />
            <span>Ví</span>
          </NavLink>

          <NavLink
            to="live"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <Radio size={18} />
            <span>Livestream</span>
          </NavLink>

          <NavLink
            to="affiliate"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <BadgePercent size={18} />
            <span>Affiliate</span>
          </NavLink>

          <NavLink
            to="statistics"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <BarChart3 size={18} />
            <span>Thống kê</span>
          </NavLink>

          <NavLink
            to="chat"
            className={({ isActive }) =>
              `seller-header-menu-item ${
                isActive ? "seller-header-menu-item-active" : ""
              }`
            }
          >
            <MessageSquareText size={18} />
            <span>Chat</span>
          </NavLink>
        </nav>
      </div>

      <div className="seller-header-right">
        <button
          type="button"
          className="seller-header-icon"
          onClick={() => navigate("/seller/chat")}
          aria-label="Chat"
        >
          <MessageSquareText size={22} />
          {unreadChatCount > 0 && (
            <span className="seller-header-badge">
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="seller-header-icon"
          onClick={() => navigate("/notification")}
          aria-label="Thông báo"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="seller-header-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="seller-header-shop" ref={menuRef}>
          <button
            type="button"
            className="seller-header-avatar-btn"
            onClick={() => setMenuOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={shopName}
                className="seller-header-avatar"
              />
            ) : (
              <span className="seller-header-avatar seller-header-avatar-fallback">
                {shopInitial}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="seller-header-shop-menu" role="menu">
              <div className="seller-header-shop-menu-head">
                {avatar ? (
                  <img src={avatar} alt={shopName} />
                ) : (
                  <span>{shopInitial}</span>
                )}
                <div>
                  <strong>{shopName}</strong>
                  {shop?.shopStatus && <small>{shop.shopStatus}</small>}
                </div>
              </div>

              <div className="seller-header-shop-menu-list">
                {shopInfoItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        item.onClick?.();
                        setMenuOpen(false);
                      }}
                    >
                      <Icon size={17} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
