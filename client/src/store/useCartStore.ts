// import { create } from "zustand";
// import api from "@/lib/api";

// export const useCartStore = create((set, get) => ({
//   cart: [],
//   cartId: null,
//   loading: false,

//   // FETCH CART
//   fetchCart: async () => {
//     try {
//       set({ loading: true });
//       const { data } = await api.get("/cart");
//       set({
//         cart: data.items,
//         cartId: data.cartId,
//         loading: false,
//       });
//     } catch {
//       set({ loading: false });
//     }
//   },

//   // ADD TO CART
//   addToCart: async (productId) => {
//     await api.post("/cart/add", { productId });
//     await get().fetchCart(); // refresh cart
//   },

//   // UPDATE QUANTITY
//   updateQuantity: async (cartItemId, quantity) => {
//     await api.post("/cart/update", { cartItemId, quantity });
//     await get().fetchCart();
//   },

//   // REMOVE ITEM
//   removeFromCart: async (cartItemId) => {
//     await api.post("/cart/remove", { cartItemId });
//     await get().fetchCart();
//   },

//   // CLEAR CART
//   clearCart: async () => {
//     await api.post("/cart/clear");
//     set({ cart: [] });
//   },
// }));




import { create } from "zustand";
import api from "@/lib/api";

export const useCartStore = create((set, get) => ({
  // state
  cart: [],
  cartId: null,
  cartTotal: 0,
  cartTotalBeforeDiscount: 0,
  cartCoupons: [],       // coupons already applied/awarded for this cart
  availableCoupons: [],  // all active coupons + availability for this cart
  loading: false,
  error: null,

  // FETCH CART - returns the raw server response too
  fetchCart: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.get("/cart");
      // server returns: { success, cartId, items, cartTotal, cartCoupons, availableCoupons }
      set({
        cart: data.items || [],
        cartId: data.cartId || null,
        cartTotal: data.cartTotal || 0,
        cartTotalBeforeDiscount: data.cartTotalBeforeDiscount || 0,
        cartCoupons: data.cartCoupons || [],
        availableCoupons: data.availableCoupons || [],
        loading: false,
      });
      return data;
    } catch (err) {
      console.error("fetchCart error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // ADD TO CART - returns awarded coupons array (if any) so UI can react (animation)
  addToCart: async (productId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/cart/add", { productId });
      // server returns { success, message, awarded } per our controller
      // refresh cart to get new totals & coupons
      await get().fetchCart();
      set({ loading: false });
      return data; // caller can inspect data.awarded (array)
    } catch (err) {
      console.error("addToCart error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // UPDATE QUANTITY - returns awarded coupons (if any)
  updateQuantity: async (cartItemId, quantity) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/cart/update", { cartItemId, quantity });
      // server returns { success, awarded }
      await get().fetchCart();
      set({ loading: false });
      return data;
    } catch (err) {
      console.error("updateQuantity error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // REMOVE ITEM - returns server response
  removeFromCart: async (cartItemId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/cart/remove", { cartItemId });
      await get().fetchCart();
      set({ loading: false });
      return data;
    } catch (err) {
      console.error("removeFromCart error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // CLEAR CART - server clears items and auto-awarded coupons
  clearCart: async () => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/cart/clear");
      // reset client state
      set({
        cart: [],
        cartId: null,
        cartTotal: 0,
        cartCoupons: [],
        availableCoupons: [],
        loading: false,
      });
      return data;
    } catch (err) {
      console.error("clearCart error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // APPLY COUPON - server returns applied coupon + updated cartCoupons & cartTotal
  applyCoupon: async (code) => {
    try {
      set({ loading: true, error: null });
      const { data } = await api.post("/cart/apply-coupon", { code });
      // server returns: { success, applied, cartTotal, cartCoupons }
      // refresh full cart (or merge partial)
      await get().fetchCart();
      set({ loading: false });
      return data;
    } catch (err) {
      console.error("applyCoupon error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // REMOVE / UNAPPLY coupon from cart
  // NOTE: add server endpoint POST /cart/remove-coupon that accepts { cartCouponId }
  // If you don't have server route yet, this will remove client-side and refetch as fallback.
  removeCartCoupon: async (cartCouponId) => {
    try {
      set({ loading: true, error: null });
      // try server endpoint first (implement on server for correct behavior)
      const { data } = await api.post("/cart/remove-coupon", { cartCouponId });
      await get().fetchCart();
      set({ loading: false });
      return data;
    } catch (err) {
      console.warn("removeCartCoupon: server remove failed, refetching cart", err);
      // fallback: fetch cart to refresh state
      await get().fetchCart();
      set({ loading: false });
      return null;
    }
  },
}));
