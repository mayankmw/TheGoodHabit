import { create } from "zustand";
import api from "@/lib/api";

type CartActionResponse = {
  success?: boolean;
  message?: string;
  awarded?: string[];
  [key: string]: unknown;
};

type CartItem = {
  cartItemId: number;
  productId: number | string;
  quantity: number;
  name: string;
  image: string | null;
  originalPrice: number;
  discountedPrice: number;
  [key: string]: unknown;
};

type CartCoupon = {
  id: number;
  cartId: number;
  couponId: number;
  code: string;
  appliedAt: string;
  is_applied: boolean;
  title: string;
  discount_type: string;
  value: number;
  max_discount: number | null;
  min_order: number;
  auto_award: boolean;
  discountApplied: number;
  [key: string]: unknown;
};

type AvailableCoupon = {
  id: number;
  code: string;
  title: string;
  description?: string;
  discount_type: string;
  value: number;
  max_discount?: number | null;
  min_order: number;
  active?: boolean;
  auto_award?: boolean;
  available: boolean;
  alreadyApplied: boolean;
  reason: string;
  [key: string]: unknown;
};

type CartResponse = CartActionResponse & {
  cartId: number | null;
  items: CartItem[];
  cartTotal: number;
  cartTotalBeforeDiscount: number;
  cartCoupons: CartCoupon[];
  availableCoupons: AvailableCoupon[];
};

interface CartState {
  cart: CartItem[];
  cartId: number | null;
  cartTotal: number;
  cartTotalBeforeDiscount: number;
  cartCoupons: CartCoupon[];
  availableCoupons: AvailableCoupon[];
  loading: boolean;
  error: unknown;
  fetchCart: () => Promise<CartResponse | null>;
  addToCart: (productId: number | string) => Promise<CartActionResponse | null>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<CartActionResponse | null>;
  removeFromCart: (cartItemId: number) => Promise<CartActionResponse | null>;
  clearCart: () => Promise<CartActionResponse | null>;
  applyCoupon: (code: string) => Promise<CartActionResponse | null>;
  removeCartCoupon: (cartCouponId: number) => Promise<CartActionResponse | null>;
}

export const useCartStore = create<CartState>((set, get) => ({
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
  fetchCart: async (): Promise<CartResponse | null> => {
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
  addToCart: async (productId: number | string): Promise<CartActionResponse | null> => {
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
  updateQuantity: async (
    cartItemId: number,
    quantity: number
  ): Promise<CartActionResponse | null> => {
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
  removeFromCart: async (cartItemId: number): Promise<CartActionResponse | null> => {
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
  clearCart: async (): Promise<CartActionResponse | null> => {
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
  applyCoupon: async (code: string): Promise<CartActionResponse | null> => {
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
  removeCartCoupon: async (cartCouponId: number): Promise<CartActionResponse | null> => {
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
