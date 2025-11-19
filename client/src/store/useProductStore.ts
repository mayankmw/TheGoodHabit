import { create } from "zustand";
import api from "@/lib/api";

// PRODUCT MODEL MATCHES Sequelize Model
interface Product {
  id: string;
  name: string;
  image: string;
  type: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
  description: string;
  ingredients: string[];
}

interface ProductState {
  products: Product[];
  product: Product | null;
  loading: boolean;

  fetchProducts: () => Promise<any>;
  fetchSingleProduct: (id: string) => Promise<any>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  product: null,
  loading: false,

  // FETCH ALL PRODUCTS (POST request)
  fetchProducts: async () => {
    try {
      set({ loading: true });

      const { data } = await api.post("/products", {});

      if (data.success) {
        set({ products: data.products });
      }

      set({ loading: false });
      return data;

    } catch (error: any) {
      set({ loading: false });
      return error.response?.data;
    }
  },

  // FETCH SINGLE PRODUCT (POST request)
  fetchSingleProduct: async (id: string) => {
    try {
      set({ loading: true });

      const { data } = await api.post("/products/details", { id });

      if (data.success) {
        set({ product: data.product });
      }

      set({ loading: false });
      return data;

    } catch (error: any) {
      set({ loading: false });
      return error.response?.data;
    }
  },
}));
