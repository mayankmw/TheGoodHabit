import { create } from "zustand";
import api from "@/lib/api";

export const useContactStore = create((set) => ({
  loading: false,

  sendMessage: async (payload) => {
    try {
      set({ loading: true });

      const { data } = await api.post("/contact/send", payload);

      set({ loading: false });
      return data;
    } catch (error) {
      set({ loading: false });
      return error?.response?.data || {
        success: false,
        message: "Something went wrong",
      };
    }
  },
}));
