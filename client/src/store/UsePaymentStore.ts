import { create } from "zustand";
import api from "@/lib/api";

export const usePaymentStore = create((set, get) => ({
  loading: false,
  error: null,

  razorpayOrderId: null,   // Razorpay order id (rp_xxx)
  appOrderId: null,        // DB order id (int)
  amount: 0,

  // 1️⃣ CREATE ORDER (server + Razorpay)
  createOrder: async () => {
    try {
      set({ loading: true, error: null });

      // call backend
      const { data } = await api.post("/orders/create");

      set({
        razorpayOrderId: data.orderId,
        appOrderId: data.appOrderId,
        amount: data.amount,
        loading: false
      });

      return data; // frontend will use: key, orderId, amount, currency
    } catch (err) {
      console.error("createOrder error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // 2️⃣ VERIFY PAYMENT
  verifyPayment: async (paymentData) => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/orders/verify", paymentData);

      set({ loading: false });

      return data;
    } catch (err) {
      console.error("verifyPayment error", err);
      set({ loading: false, error: err?.response?.data || err.message });
      return null;
    }
  },

  // 3️⃣ RESET AFTER SUCCESS
  reset: () =>
    set({
      loading: false,
      error: null,
      razorpayOrderId: null,
      appOrderId: null,
      amount: 0
    }),
}));
