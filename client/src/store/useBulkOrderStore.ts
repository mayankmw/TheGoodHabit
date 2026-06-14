import { create } from "zustand";
import api from "@/lib/api";

type BulkOrderItemPayload = {
  productId: number;
  quantity: number;
};

type BulkOrderPayload = {
  name: string;
  email: string;
  phone: string;
  address: string;
  items: BulkOrderItemPayload[];
};

type BulkOrderResponse = {
  success: boolean;
  message: string;
};

interface BulkOrderState {
  loading: boolean;
  submitBulkOrder: (payload: BulkOrderPayload) => Promise<BulkOrderResponse>;
}

export const useBulkOrderStore = create<BulkOrderState>((set) => ({
  loading: false,

  submitBulkOrder: async (payload) => {
    try {
      set({ loading: true });

      const { data } = await api.post("/bulk-order/submit", payload);

      set({ loading: false });
      return data;
    } catch (error: unknown) {
      const responseError = error as {
        response?: {
          data?: BulkOrderResponse;
        };
      };

      set({ loading: false });
      return responseError?.response?.data || {
        success: false,
        message: "Something went wrong",
      };
    }
  },
}));
