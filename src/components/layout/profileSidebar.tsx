import {
  BadgePercent,
  LogOut,
  MapPin,
  Menu,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
  User,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../../css/components/layout/profileSidebar.css";
import { logout } from "../../services/auth.api";
import { getMyShop } from "../../services/shop.api";
import LoadingOverlay from "../loadingOverlay";

type MyShop = {
  id?: string;
  shopId?: string;
  status?: string;
  kycStatus?: string;
  shopStatus?: string;
};

const menus = [
  {
    label: "Hồ sơ cá nhân",
    path: "/profile",
    icon: User,
  },
  {
    label: "Địa chỉ giao hàng",
    path: "/profile/address",
    icon: MapPin,
  },
  {
    label: "Đơn mua",
    path: "/profile/orders",
    icon: ShoppingBag,
  },
  {
    label: "Ví AntiFake",
    path: "/profile/wallet",
    icon: Wallet,
  },
  {
    label: "Affiliate cá nhân",
    path: "/affiliate?tab=member",
    icon: BadgePercent,
  },
  {
    label: "Xác thực sản phẩm bằng QR",
    path: "/qr",
    icon: QrCode,
  },
  {
    label: "Cửa hàng của tôi",
    path: "/seller/dashboard",
    icon: Store,
  },
  {
    label: "Cài đặt AntiFake",
    path: "/install",
    icon: Settings,
  },
  {
    label: "Đăng xuất",
    path: "/logout",
    icon: LogOut,
  },
];

const normalizeMyShop = (data: unknown): MyShop | null => {
  const payload =
    data && typeof data === "object"
      ? (data as { data?: unknown; items?: unknown }).data ??
        (data as { items?: unknown }).items ??
        data
      : data;

  if (Array.isArray(payload)) {
    return (payload[0] as MyShop | undefined) ?? null;
  }

  return payload && typeof payload === "object" ? (payload as MyShop) : null;
};

const getShopStatus = (shop: MyShop) =>
  String(shop.status ?? shop.kycStatus ?? shop.shopStatus ?? "")
    .trim()
    .toLowerCase();

const isRejectedShop = (status: string) =>
  status.includes("reject") ||
  status.includes("rejected") ||
  status.includes("declined") ||
  status.includes("failed");

export default function ProfileSidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [checkingShop, setCheckingShop] = useState(false);

  const handleMyShopClick = async () => {
    if (checkingShop) return;

    setCheckingShop(true);

    try {
      const shop = normalizeMyShop(await getMyShop());
      const shopId = shop?.shopId || shop?.id;

      setOpen(false);

      if (!shop || !shopId) {
        navigate("/register");
        return;
      }

      const status = getShopStatus(shop);

      if (status === "pending_kyc") {
        navigate("/register", {
          state: { initialStep: 2, shopId: String(shopId) },
        });
        return;
      }

      if (status === "pending_verification") {
        navigate("/register", {
          state: {
            initialStep: 3,
            registrationStatus: "pending_kyc",
            shopId: String(shopId),
          },
        });
        return;
      }

      if (status === "verified") {
        navigate("/seller/dashboard");
        return;
      }

      if (isRejectedShop(status)) {
        navigate("/register", {
          state: {
            initialStep: 3,
            registrationStatus: "rejected",
            shopId: String(shopId),
          },
        });
        return;
      }

      navigate("/register");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Không thể kiểm tra cửa hàng",
      );
    } finally {
      setCheckingShop(false);
    }
  };

  return (
    <>
      {checkingShop && <LoadingOverlay />}

      {open && (
        <div
          className="profile-sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className="profile-sidebar">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="profile-sidebar-header">
              <h3>Cá nhân</h3>
              <p>Quản lý bảo mật & hồ sơ</p>
            </div>
            <button
              type="button"
              className="profile-menu-btn"
              aria-label={open ? "Đóng menu tài khoản" : "Mở menu tài khoản"}
              aria-expanded={open}
              aria-controls="profile-sidebar-menu"
              onClick={() => setOpen(!open)}
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="profile-sidebar-divider" />

          <nav
            id="profile-sidebar-menu"
            className={`profile-sidebar-menu ${
              open ? "profile-sidebar-menu-open" : ""
            }`}
          >
            {menus.map((item) => {
              const Icon = item.icon;

              if (item.path === "/logout") {
                return (
                  <button
                    key={item.path}
                    className="profile-sidebar-link profile-logout-link"
                    onClick={logout}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              if (item.path === "/seller/dashboard") {
                return (
                  <button
                    key={item.path}
                    className="profile-sidebar-link profile-shop-link"
                    onClick={handleMyShopClick}
                    disabled={checkingShop}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/profile"}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    isActive
                      ? "profile-sidebar-link active"
                      : "profile-sidebar-link"
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
