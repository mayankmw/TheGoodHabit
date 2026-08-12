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

  // payment snapshot — null status/method means it never got past "created"
  paymentMethod: string | null;
  paymentStatus: string | null;
  paymentDetails: PaymentDetails;
  razorpayPaymentId: string | null;
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
}));
