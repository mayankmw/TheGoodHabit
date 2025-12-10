import { create } from "zustand";
import api from "@/lib/api";

export const useCartStore = create((set, get) => ({
  cart: [],
  cartId: null,
  loading: false,

  // FETCH CART
  fetchCart: async () => {
    try {
      set({ loading: true });
      const { data } = await api.get("/cart");
      set({
        cart: data.items,
        cartId: data.cartId,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  // ADD TO CART
  addToCart: async (productId) => {
    await api.post("/cart/add", { productId });
    await get().fetchCart(); // refresh cart
  },

  // UPDATE QUANTITY
  updateQuantity: async (cartItemId, quantity) => {
    await api.post("/cart/update", { cartItemId, quantity });
    await get().fetchCart();
  },

  // REMOVE ITEM
  removeFromCart: async (cartItemId) => {
    await api.post("/cart/remove", { cartItemId });
    await get().fetchCart();
  },

  // CLEAR CART
  clearCart: async () => {
    await api.post("/cart/clear");
    set({ cart: [] });
  },
}));
