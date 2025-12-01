import { create } from "zustand";
import api from "@/lib/api";

interface User {
  orders: any[];
  addresses: any[];
  id?: number;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;

  sendOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, code: string) => Promise<any>;
  logout: () => void;
  fetchMe: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  loading: false,

  // SEND OTP
  sendOtp: async (email) => {
    try {
      set({ loading: true });
      const { data } = await api.post("/user/send-otp", { email });
      set({ loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false });
      return error.response.data;
    }
  },

  // VERIFY OTP
  verifyOtp: async (email, code) => {
    try {
      const { data } = await api.post("/user/verify-otp", { email, code });

      if (data.success) {
        localStorage.setItem("token", data.token);
        set({ token: data.token, user: data.user });
      }

      return data;
    } catch (error: any) {
      return error.response.data;
    }
  },

  // LOGOUT
    logout: (callback?: () => void) => {
      localStorage.removeItem("token");
      set({ token: null, user: null });

      if (callback) callback();
    },

  // FETCH CURRENT USER
  fetchMe: async () => {
    const token = get().token;
    if (!token) return null;

    const { data } = await api.post("/user/me");

    set({
      user: {
        ...data.user,
        addresses: data.addresses || [],
        orders: data.orders || [],
      },
    });

    return data;
  },

}));
