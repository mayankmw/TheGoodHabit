import { create } from "zustand";
import api from "@/lib/api";

// PRODUCT MODEL MATCHES Sequelize Model
interface Product {
  id: string | number;
  name: string;
  image: string;
  category?: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
  description: string;
  ingredients: string[];
}

interface ProductState {
  products: Product[];
  recommended: Product[];
  frequentlyBought: Product[];
  product: Product | null;
  loading: boolean;
  loadingFrequentlyBought: boolean;

  fetchProducts: () => Promise<any>;
  fetchSingleProduct: (id: string) => Promise<any>;
  fetchRecommended: () => Promise<any>;
  fetchFrequentlyBought: (id: string) => Promise<any>;
  searchProducts: (query: string) => Promise<any>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  recommended: [],
  frequentlyBought: [],
  product: null,
  loading: false,
  loadingFrequentlyBought: false,

  fetchProducts: async () => {
    try {
      set({ loading: true });
      const { data } = await api.post("/products", {});
      if (data.success) set({ products: data.products });
    } finally {
      set({ loading: false });
    }
  },

  fetchRecommended: async () => {
    try {
      const { data } = await api.post("/products", { recommended: true });
      if (data.success) set({ recommended: data.products });
    } catch {}
  },

  fetchFrequentlyBought: async (id: string) => {
    try {
      set({ loadingFrequentlyBought: true });
      const { data } = await api.post("/products/frequently-bought", { id, limit: 3 });
      if (data.success) set({ frequentlyBought: data.products || [] });
      return data;
    } catch {
      return { success: false };
    } finally {
      set({ loadingFrequentlyBought: false });
    }
  },

  searchProducts: async (query) => {
    const { data } = await api.post("/products", { search: query });
    if (data.success) set({ products: data.products });
    return data;
  },

  fetchSingleProduct: async (id: string) => {
    try {
      set({ loading: true });
      const { data } = await api.post("/products/details", { id });
      if (data.success) set({ product: data.product });
    } finally {
      set({ loading: false });
    }
  },
}));
