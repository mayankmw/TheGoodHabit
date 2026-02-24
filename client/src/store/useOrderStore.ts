import { create } from "zustand";
import api from "@/lib/api";

interface OrderItem {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
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
