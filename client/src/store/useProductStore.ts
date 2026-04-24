import { create } from "zustand";
import api from "@/lib/api";

interface Product {
  id: string | number;
  name: string;
  image: string | null;
  images?: string[];
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

  fetchProducts: () => Promise<unknown>;
  fetchSingleProduct: (id: string) => Promise<unknown>;
  fetchRecommended: () => Promise<unknown>;
  fetchFrequentlyBought: (id: string) => Promise<unknown>;
  searchProducts: (query: string) => Promise<unknown>;
}

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

type ProductPayload = Partial<Product> & { [key: string]: unknown };

const normalizeProduct = (product: unknown): Product => {
  const source: ProductPayload =
    product && typeof product === "object" ? (product as ProductPayload) : {};

  const images = [...new Set(parseStringArray(source.images))];

  const ingredients = parseStringArray(source.ingredients);

  return {
    ...(source as Product),
    id: typeof source.id === "string" || typeof source.id === "number" ? source.id : "",
    name: typeof source.name === "string" ? source.name : "",
    category: typeof source.category === "string" ? source.category : undefined,
    originalPrice: Number(source.originalPrice || 0),
    discountedPrice: Number(source.discountedPrice || 0),
    rating: Number(source.rating || 0),
    reviews: Number(source.reviews || 0),
    description: typeof source.description === "string" ? source.description : "",
    image: images[0] || null,
    images,
    ingredients,
  };
};

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
      if (data.success) {
        set({ products: (data.products || []).map((p: unknown) => normalizeProduct(p)) });
      }
    } finally {
      set({ loading: false });
    }
  },

  fetchRecommended: async () => {
    try {
      const { data } = await api.post("/products", { recommended: true });
      if (data.success) {
        set({ recommended: (data.products || []).map((p: unknown) => normalizeProduct(p)) });
      }
    } catch (error) {
      console.error("fetchRecommended error", error);
    }
  },

  fetchFrequentlyBought: async (id: string) => {
    try {
      set({ loadingFrequentlyBought: true });
      const { data } = await api.post("/products/frequently-bought", { id, limit: 3 });
      if (data.success) {
        set({
          frequentlyBought: (data.products || []).map((p: unknown) => normalizeProduct(p)),
        });
      }
      return data;
    } catch {
      return { success: false };
    } finally {
      set({ loadingFrequentlyBought: false });
    }
  },

  searchProducts: async (query: string) => {
    const { data } = await api.post("/products", { search: query });
    if (data.success) {
      set({ products: (data.products || []).map((p: unknown) => normalizeProduct(p)) });
    }
    return data;
  },

  fetchSingleProduct: async (id: string) => {
    try {
      set({ loading: true });
      const { data } = await api.post("/products/details", { id });
      if (data.success) set({ product: normalizeProduct(data.product) });
    } finally {
      set({ loading: false });
    }
  },
}));
