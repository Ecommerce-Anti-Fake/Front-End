import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Store } from "lucide-react";
import { toast } from "sonner";

import CartItem from "../../components/cart/cartItem";
import CartSummary from "../../components/cart/cartSummary";
import EmptyState from "../../components/common/emptyState";

import "../../css/pages/cart.css";

import {
  deleteCartItem,
  fetchCart,
  updateCartItemQuantity,
} from "../../services/cart.api";
import { useCartStore } from "../../store/cartStore";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";
import type { CartItem as CartItemType, CartShop } from "../../type/checkout";

type SelectableCartItem = CartItemType & { selected: boolean };
type SelectableCartShop = Omit<CartShop, "items"> & { items: SelectableCartItem[] };

const getCartItemGroupKey = (item: CartItemType) =>
  `${item.offerId}:${item.variantId ?? "default"}`;

function CartLoading() {
  return (
    <div className="cart-page">
      <div className="cart-left">
        <div className="cart-header">
          <h1>Giỏ hàng của bạn</h1>
          <span className="cart-loading-title" aria-hidden="true" />
        </div>

        <div className="cart-loading-card" role="status" aria-live="polite">
          {Array.from({ length: 3 }, (_, index) => (
            <div className="cart-loading-row" key={index}>
              <span />
              <div>
                <span />
                <span />
              </div>
              <span />
            </div>
          ))}
        </div>
      </div>

      <div className="cart-right">
        <div className="cart-summary cart-summary-loading">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const [cartShops, setCartShops] = useState<SelectableCartShop[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  const [cartActionLoading, setCartActionLoading] = useState("");
  const refreshCart = useCartStore((state) => state.refreshCart);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoadingCart(true);
        const data = await fetchCart();

        setCartShops(
          (data.shops || []).map((shop) => ({
            ...shop,
            items: shop.items.map((item) => ({
              ...item,
              selected: false,
            })),
          })),
        );
        refreshCart();
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải giỏ hàng");
      } finally {
        setLoadingCart(false);
      }
    };

    loadCart();
  }, [refreshCart]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity < 1 || cartActionLoading) return;

    try {
      setCartActionLoading(itemId);
      showLoading("Đang cập nhật giỏ hàng...");
      await updateCartItemQuantity(itemId, quantity);

      setCartShops((prev) =>
        prev.map((shop) => ({
          ...shop,
          items: shop.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        })),
      );
      await refreshCart();
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật giỏ hàng thất bại");
    } finally {
      setCartActionLoading("");
      hideLoading();
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (cartActionLoading) return;

    try {
      setCartActionLoading(itemId);
      showLoading("Đang xóa sản phẩm...");
      await deleteCartItem(itemId);

      setCartShops((prev) =>
        prev
          .map((shop) => ({
            ...shop,
            items: shop.items.filter((item) => item.id !== itemId),
          }))
          .filter((shop) => shop.items.length > 0),
      );
      refreshCart();
    } catch (error) {
      console.error(error);
      toast.error("Xóa thất bại!");
    } finally {
      setCartActionLoading("");
      hideLoading();
    }
  };

  const isShopSelected = (shopId: string) => {
    const shop = cartShops.find((item) => item.shopId === shopId);
    if (!shop) return false;
    return shop.items.some((item) => item.selected);
  };

  const toggleShopSelect = (shopId: string) => {
    if (cartActionLoading) return;

    setCartShops((prev) =>
      prev.map((shop) => {
        if (shop.shopId !== shopId) return shop;

        const allSelected = shop.items.every((item) => item.selected);

        return {
          ...shop,
          items: shop.items.map((item) => ({
            ...item,
            selected: !allSelected,
          })),
        };
      }),
    );
  };

  const toggleSelect = (id: string) => {
    if (cartActionLoading) return;

    setCartShops((prev) =>
      prev.map((shop) => ({
        ...shop,
        items: shop.items.map((item) =>
          item.id === id ? { ...item, selected: !item.selected } : item,
        ),
      })),
    );
  };

  const subtotal = cartShops.reduce(
    (shopSum, shop) =>
      shopSum +
      shop.items
        .filter((item) => item.selected)
        .reduce(
          (itemSum: number, item) =>
            itemSum + item.unitPriceSnapshot * item.quantity,
          0,
        ),
    0,
  );

  const discount = 0;
  const total = subtotal - discount;
  const totalItems = cartShops.reduce((sum, shop) => sum + shop.items.length, 0);

  const selectedShops = cartShops
    .map((shop) => ({
      ...shop,
      items: shop.items.filter((item) => item.selected),
    }))
    .filter((shop) => shop.items.length > 0);

  if (loadingCart) return <CartLoading />;

  if (totalItems === 0) {
    return (
      <div className="cart-page cart-page-empty">
        <EmptyState
          className="cart-empty-state"
          icon={<ShoppingCart size={34} />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy thêm sản phẩm yêu thích vào giỏ hàng để có thể mua nhanh hơn ở lần tiếp theo."
          action={
            <Link to="/search">
              <Search size={18} />
              Tìm sản phẩm
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-left">
        <div className="cart-header">
          <h1>Giỏ hàng của bạn</h1>
          <span>({totalItems} sản phẩm)</span>
        </div>

        {cartShops.map((shop) => (
          <div key={shop.shopId} className="cart-shop">
            <div className="cart-shop-header">
              <input
                type="checkbox"
                checked={isShopSelected(shop.shopId)}
                disabled={Boolean(cartActionLoading)}
                onChange={() => toggleShopSelect(shop.shopId)}
              />

              <Store size={18} />

              <span>{shop.shopName}</span>
            </div>

            {shop.items.map((item) => (
              <div
                key={`${item.id}:${getCartItemGroupKey(item)}`}
                className={cartActionLoading === item.id ? "cart-item-busy" : ""}
              >
                <CartItem
                  item={item}
                  toggleSelect={toggleSelect}
                  onQuantityChange={handleQuantityChange}
                  onDelete={handleDeleteItem}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="cart-right">
        <CartSummary
          subtotal={subtotal}
          discount={discount}
          total={total}
          selectedShops={selectedShops}
        />
      </div>
    </div>
  );
}
