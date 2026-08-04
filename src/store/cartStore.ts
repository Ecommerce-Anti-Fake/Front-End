import { create } from "zustand";
import { fetchCart } from "../services/cart.api";
import type { CartResponse } from "../type/checkout";

type CartStore = {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
};

export const useCartStore = create<CartStore>((set) => ({
  cartCount: 0,

  setCartCount: (count) =>
    set({
      cartCount: count,
    }),

  refreshCart: async () => {
    try {
      const data = await fetchCart();

      const cart = data as CartResponse;
      const count = cart.shops.reduce(
        (sum, shop) =>
          sum + shop.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      );

      set({
        cartCount: count,
      });
    } catch (error) {
      console.error(error);
    }
  },
}));
