import { create } from "zustand";
import api from "@/lib/api";
import type { PaymentDetails } from "@/lib/payment";

interface OrderItem {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderReview {
  productId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDraft {
  productId: number;
  rating: number;
  comment?: string;
}

interface Order {
  id: number;
  orderCode: string;
  totalPrice: number;
  discountedPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];

  // delivery address snapshot at order time — null on orders placed before
  // address selection existed
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingPhone: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  shippingPartner: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;

  // payment snapshot — null status/method means it never got past "created"
  paymentMethod: string | null;
  paymentStatus: string | null;
  paymentDetails: PaymentDetails;
  razorpayPaymentId: string | null;

  // review state — reviews is empty until the customer rates the order, and
  // reviewPromptDismissed is their "Not now" on the delivered-order prompt
  reviews: OrderReview[];
  reviewPromptDismissed: boolean;
}

interface OrderState {
  orders: Order[];
  page: number;
  hasMore: boolean;
  status: string;
  loading: boolean;

  fetchOrders: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  changeStatus: (status: string) => Promise<void>;
  submitReview: (orderId: number, reviews: ReviewDraft[]) => Promise<string | null>;
  dismissReviewPrompt: (orderId: number) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  page: 1,
  hasMore: true,
  status: "all",
  loading: false,

  fetchOrders: async (reset = false) => {
    const { page, status } = get();

    try {
      set({ loading: true });

      const { data } = await api.post("/orders", {
        page,
        limit: 10,
        status,
      });

      set((state) => ({
        orders: reset ? data.orders : [...state.orders, ...data.orders],
        hasMore: data.hasMore,
        loading: false,
      }));
    } catch (err) {
      console.error("fetchOrders error", err);
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { hasMore } = get();
    if (!hasMore) return;

    set((state) => ({ page: state.page + 1 }));
    await get().fetchOrders();
  },

  changeStatus: async (status) => {
    set({ status, page: 1, orders: [] });
    await get().fetchOrders(true);
  },

  // resolves to null on success, or the error message to surface
  submitReview: async (orderId, reviews) => {
    try {
      const { data } = await api.post("/reviews/submit", { orderId, reviews });

      if (!data?.success) return data?.message || "Could not save your review";

      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, reviews: data.reviews || order.reviews }
            : order
        ),
      }));

      return null;
    } catch (err) {
      console.error("submitReview error", err);
      return (
        err?.response?.data?.message || "Could not save your review"
      );
    }
  },

  dismissReviewPrompt: async (orderId) => {
    // hide it right away — a failed call only means it reappears on reload
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, reviewPromptDismissed: true } : order
      ),
    }));

    try {
      await api.post("/reviews/dismiss", { orderId });
    } catch (err) {
      console.error("dismissReviewPrompt error", err);
    }
  },
}));
