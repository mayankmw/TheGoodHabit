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

// Minimal product info a caller can pass so a guest (logged-out) add-to-cart
// has something to render without a server round trip.
type GuestProductMeta = {
  name?: string;
  image?: string | null;
  originalPrice?: number;
  discountedPrice?: number;
};

type GuestCartEntry = {
  productId: number | string;
  quantity: number;
  name: string;
  image: string | null;
  originalPrice: number;
  discountedPrice: number;
};

const GUEST_CART_KEY = "guest_cart";

const isLoggedIn = () =>
  typeof window !== "undefined" && !!localStorage.getItem("token");

const readGuestCart = (): GuestCartEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items: GuestCartEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const calcTotal = (items: { discountedPrice: number; quantity: number }[]) =>
  items.reduce((s, it) => s + (it.discountedPrice || 0) * (it.quantity || 0), 0);

// Guest items have no server-side cart_items row, so we use the productId
// itself as a stand-in cartItemId — it's unique per guest cart anyway.
const guestCartToCartResponse = (items: GuestCartEntry[]): CartResponse => {
  const cartItems: CartItem[] = items.map((it) => ({
    cartItemId: Number(it.productId),
    productId: it.productId,
    quantity: it.quantity,
    name: it.name,
    image: it.image,
    originalPrice: it.originalPrice,
    discountedPrice: it.discountedPrice,
  }));
  const total = calcTotal(cartItems);
  return {
    success: true,
    cartId: null,
    items: cartItems,
    cartTotal: total,
    cartTotalBeforeDiscount: total,
    cartCoupons: [],
    availableCoupons: [],
  };
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
  addToCart: (
    productId: number | string,
    product?: GuestProductMeta
  ) => Promise<CartActionResponse | null>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<CartActionResponse | null>;
  removeFromCart: (cartItemId: number) => Promise<CartActionResponse | null>;
  clearCart: () => Promise<CartActionResponse | null>;
  applyCoupon: (code: string) => Promise<CartActionResponse | null>;
  removeCartCoupon: (cartCouponId: number) => Promise<CartActionResponse | null>;
  // Pushes any locally-stored guest cart items into the server cart. Call
  // this right after a successful login so a pre-login cart isn't lost.
  mergeGuestCartIntoServer: () => Promise<void>;
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
    if (!isLoggedIn()) {
      const response = guestCartToCartResponse(readGuestCart());
      set({
        cart: response.items,
        cartId: null,
        cartTotal: response.cartTotal,
        cartTotalBeforeDiscount: response.cartTotalBeforeDiscount,
        cartCoupons: [],
        availableCoupons: [],
        loading: false,
        error: null,
      });
      return response;
    }

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
  addToCart: async (
    productId: number | string,
    product?: GuestProductMeta
  ): Promise<CartActionResponse | null> => {
    // Not signed in: keep the cart in localStorage instead of hitting the
    // (auth-protected) server route, so adding an item never fails.
    if (!isLoggedIn()) {
      set({ loading: true, error: null });
      const items = readGuestCart();
      const existing = items.find((it) => String(it.productId) === String(productId));
      if (existing) {
        existing.quantity += 1;
      } else {
        items.push({
          productId,
          quantity: 1,
          name: product?.name || "",
          image: product?.image ?? null,
          originalPrice: Number(product?.originalPrice || 0),
          discountedPrice: Number(product?.discountedPrice || 0),
        });
      }
      writeGuestCart(items);

      const response = guestCartToCartResponse(items);
      set({
        cart: response.items,
        cartId: null,
        cartTotal: response.cartTotal,
        cartTotalBeforeDiscount: response.cartTotalBeforeDiscount,
        cartCoupons: [],
        availableCoupons: [],
        loading: false,
      });
      return { success: true, message: "Added to cart" };
    }

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
    if (!isLoggedIn()) {
      if (quantity < 1) return { success: false, message: "Quantity must be at least 1" };
      const items = readGuestCart();
      const item = items.find((it) => Number(it.productId) === Number(cartItemId));
      if (!item) return { success: false, message: "Item not found in cart" };
      item.quantity = quantity;
      writeGuestCart(items);

      const response = guestCartToCartResponse(items);
      set({
        cart: response.items,
        cartTotal: response.cartTotal,
        cartTotalBeforeDiscount: response.cartTotalBeforeDiscount,
      });
      return { success: true };
    }

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
    if (!isLoggedIn()) {
      const items = readGuestCart().filter(
        (it) => Number(it.productId) !== Number(cartItemId)
      );
      writeGuestCart(items);

      const response = guestCartToCartResponse(items);
      set({
        cart: response.items,
        cartTotal: response.cartTotal,
        cartTotalBeforeDiscount: response.cartTotalBeforeDiscount,
      });
      return { success: true };
    }

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
    if (!isLoggedIn()) {
      writeGuestCart([]);
      set({
        cart: [],
        cartId: null,
        cartTotal: 0,
        cartTotalBeforeDiscount: 0,
        cartCoupons: [],
        availableCoupons: [],
      });
      return { success: true };
    }

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
    // Coupons live on the server-side cart, so guests have nothing to apply
    // to yet — say so instead of firing a request that just 401s.
    if (!isLoggedIn()) {
      return { success: false, message: "Please sign in to apply a coupon" };
    }

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
    if (!isLoggedIn()) {
      return { success: false, message: "Please sign in to manage coupons" };
    }

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

  // Called right after login succeeds: pushes whatever was added to the
  // guest cart onto the user's real server cart, then clears local storage.
  mergeGuestCartIntoServer: async (): Promise<void> => {
    const items = readGuestCart();
    if (!items.length) {
      await get().fetchCart();
      return;
    }

    try {
      for (const item of items) {
        const copies = Math.max(1, Math.round(Number(item.quantity) || 1));
        // server's /cart/add increments quantity by 1 per call — there's no
        // bulk-quantity endpoint, so call it once per unit.
        for (let i = 0; i < copies; i++) {
          await api.post("/cart/add", { productId: item.productId });
        }
      }
      writeGuestCart([]);
    } catch (err) {
      console.error("mergeGuestCartIntoServer error", err);
    } finally {
      await get().fetchCart();
    }
  },
}));
