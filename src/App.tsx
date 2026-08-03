import { useEffect, useRef } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/home";
import CommunityPage from "./pages/community";
import ProfilePage from "./pages/profile";
import AffiliatePage from "./pages/affiliate";
import CartPage from "./pages/cart";
import NotificationPage from "./pages/notification";
import UserChatPage from "./pages/user/ChatPage";
import QRPage from "./pages/qr";
import SearchPage from "./pages/search";
import WishlistPage from "./pages/wishlish";
import "../src/App.css";
import ProductDetail from "./pages/product/productDetail";
import OrdersPage from "./pages/profile/ordersPage";
import SettingsPage from "./pages/profile/settingsPage";
import WalletPage from "./pages/profile/walletPage";
import UserProfile from "./pages/profile/userProfile";
import OrderDetailPage from "./components/order/orderDetail";
import ShopPage from "./pages/shop";
import ShopProducts from "./components/shop/shopProducts";
import ShopCategories from "./components/shop/shopCategories";
import ShopReviews from "./components/shop/shopReviews";
import { Toaster } from "sonner";
import ProtectedRoute from "./routes/protectedRoute";
import AuthPage from "./pages/auth";
import EmailActionPage from "./pages/auth/email-action";
import LiveRoomPage from "./pages/live";
import LiveDiscoveryPage from "./pages/live/list";
import CheckoutPage from "./pages/checkout";
import MainLayout from "./layouts/mainLayout";
import SellerLayout from "./layouts/sellerLayout";
import AdminLayout from "./layouts/adminLayout";
import SellerDashboard from "./pages/shop/seller/dashboard";
import ProductManagement from "./pages/shop/seller/productManagement";
import SellerProductDetail from "./pages/shop/seller/productManagement/detail";
import OrderManagement from "./pages/shop/seller/orderManagement";
import SellerWallet from "./pages/shop/seller/wallet";
import SellerAffiliatePage from "./pages/shop/seller/affiliate";
import SellerShopInfo from "./pages/shop/seller/shopInfo";
import SellerBusinessInfo from "./pages/shop/seller/businessInfo";
import SellerChatPage from "./pages/shop/seller/ChatPage";
import ProfileAddress from "./pages/profile/addressPage";
import SellerOrderDetail from "./components/orderManagement/orderDetail";
import SellerRegistration from "./components/sellerRegistration/sellerRegistration";
import PaymentModel from "./components/payment/paymentModel";
import PaymentFailedPage from "./components/payment/paymentFailed";
import PaymentSuccess from "./components/payment/paymentSuccess";
import AdminDashboardPage from "./pages/admin";
import AdminUsersPage from "./pages/admin/users";
import AdminUserDetailPage from "./pages/admin/users/detail";
import AdminShopRegistrationsPage from "./pages/admin/shopRegistrations";
import AdminShopVerificationDetailPage from "./pages/admin/shopRegistrations/detail";
import AdminProductRegistrationsPage from "./pages/admin/productRegistrations";
import AdminProductDetailPage from "./pages/admin/productRegistrations/detail";
import AdminVouchersPage from "./pages/admin/vouchers";
import AdminWithdrawRequestsPage from "./pages/admin/withdrawRequests";
import AdminChatPage from "./pages/admin/ChatPage";
import GlobalLoadingOverlay from "./components/common/globalLoadingOverlay";
import CategoriesPage from "./pages/categories";
import AdminCategoriesPage from "./pages/admin/categories";
import AdminWalletPage from "./pages/admin/wallet";
import SellerVoucherManagement from "./pages/shop/seller/voucherManagement";
import SellerLivePage from "./pages/shop/seller/live";
import {
  resolveAffiliateAttribution,
  saveAffiliateAttribution,
} from "./services/affiliate.api";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const isChatRoute =
      pathname === "/chat" ||
      pathname.startsWith("/chat/") ||
      pathname === "/seller/chat" ||
      pathname.startsWith("/seller/chat/") ||
      pathname === "/admin/chat" ||
      pathname.startsWith("/admin/chat/");

    if (isChatRoute) {
      return;
    }

    // Scroll ve dau trang moi khi nguoi dung vao route hoac query moi.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

function AffiliateAttributionCapture() {
  const { search } = useLocation();
  const requestSequence = useRef(0);

  useEffect(() => {
    const requestId = ++requestSequence.current;
    const code = new URLSearchParams(search).get("aff")?.trim();
    if (!code) return;

    const controller = new AbortController();
    void resolveAffiliateAttribution(code, controller.signal)
      .then((attribution) => {
        if (
          !controller.signal.aborted &&
          requestId === requestSequence.current
        ) {
          saveAffiliateAttribution(attribution);
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Invalid links remain non-blocking; checkout still accepts a manual code.
      });

    return () => controller.abort();
  }, [search]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <div>
        <Toaster richColors position="top-center" />
        <GlobalLoadingOverlay />
        <ScrollToTop />
        <AffiliateAttributionCapture />
        <div className="app-container">
          <Routes>
            

            {/* USER */}
            <Route element={<MainLayout />}>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/auth/email-action" element={<EmailActionPage />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              >
                <Route index element={<UserProfile />} />
                <Route path="address" element={<ProfileAddress />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route
                  path="/profile/orders/:id"
                  element={<OrderDetailPage />}
                />
              </Route>
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notification"
                element={
                  <ProtectedRoute>
                    <NotificationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <UserChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <UserChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:roomId"
                element={
                  <ProtectedRoute>
                    <UserChatPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/messages/:roomId" element={<UserChatPage />} />
              <Route path="/qr" element={<QRPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/shop/:shopId" element={<ShopPage />}>
                <Route index element={<ShopReviews />} />
                <Route path="products" element={<ShopProducts />} />
                <Route path="categories" element={<ShopCategories />} />
              </Route>
              <Route path="/live" element={<LiveDiscoveryPage />} />
              <Route path="/live/:id" element={<LiveRoomPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/register" element={<SellerRegistration />} />
              <Route path="/payment" element={<PaymentModel />} />
              <Route path="/payment-failed" element={<PaymentFailedPage />} />
            </Route>

            {/* seller */}
            <Route
              path="/seller"
              element={
                <ProtectedRoute>
                  <SellerLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="products/:offerId" element={<SellerProductDetail />} />
              <Route path="orders" element={<OrderManagement />} />
              <Route path="orders/:orderId" element={<SellerOrderDetail />} />
              <Route path="wallet" element={<SellerWallet />} />
              <Route path="affiliate" element={<SellerAffiliatePage />} />
              <Route path="vouchers" element={<SellerVoucherManagement />} />
              <Route path="live" element={<SellerLivePage />} />
              <Route path="shop-info" element={<SellerShopInfo />} />
              <Route path="business-info" element={<SellerBusinessInfo />} />
              <Route path="chat" element={<SellerChatPage />} />
              <Route path="chat/:roomId" element={<SellerChatPage />} />
            </Route>

            {/* admin */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:userId" element={<AdminUserDetailPage />} />
              <Route
                path="shop-registrations"
                element={<AdminShopRegistrationsPage />}
              />
              <Route
                path="shop-registrations/:shopId"
                element={<AdminShopVerificationDetailPage />}
              />
              <Route
                path="product-registrations"
                element={<AdminProductRegistrationsPage />}
              />
              <Route
                path="product-registrations/:offerId"
                element={<AdminProductDetailPage />}
              />
              <Route path="vouchers" element={<AdminVouchersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="wallet" element={<AdminWalletPage />} />
              <Route path="chat" element={<AdminChatPage />} />
              <Route path="chat/:roomId" element={<AdminChatPage />} />
              <Route
                path="withdraw-requests"
                element={<AdminWithdrawRequestsPage />}
              />
            </Route>
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
