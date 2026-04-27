import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id?: number;
  email: string;
  name?: string;
  phone?: string | null;
  isAdmin?: boolean; 
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;

  googleLogin: (credential: string) => Promise<any>;
  sendOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, code: string) => Promise<any>;
  logout: (callback?: () => void) => void;
  fetchMe: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: null,
  loading: false,

  googleLogin: async (credential) => {
    try {
      set({ loading: true });

      const { data } = await api.post("/user/google-login", { credential });

      if (data.success) {
        localStorage.setItem("token", data.token);
        set({ token: data.token, user: data.user });
      }

      set({ loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false });
      return error.response?.data;
    }
  },

  sendOtp: async (email) => {
    try {
      set({ loading: true });
      const { data } = await api.post("/user/send-otp", { email });
      set({ loading: false });
      return data;
    } catch (error: any) {
      set({ loading: false });
      return error.response?.data;
    }
  },

verifyOtp: async (email, code) => {
  try {
    set({ loading: true });

    const { data } = await api.post("/user/verify-otp", { email, code });

    if (data.success) {
      localStorage.setItem("token", data.token);
      set({ token: data.token, user: data.user });
    }

    set({ loading: false });
    return data;
  } catch (error: any) {
    set({ loading: false });
    return error.response?.data;
  }
},

  logout: (callback) => {
    localStorage.removeItem("token");
    set({ token: null, user: null });

    if (callback) callback();
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null }); // 👈 important
      return null;
    }

    try {
      const { data } = await api.post("/user/me");

      set({
        user: {
          ...data.user,
        },
      });

      return data.user;
    } catch (err) {
      set({ user: null, token: null });
      localStorage.removeItem("token");
      return null;
    }
  },
}));
