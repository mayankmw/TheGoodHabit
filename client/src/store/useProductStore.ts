import { create } from "zustand";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import { isProductId } from "@/lib/productUrl";

interface Product {
  id: string | number;
  // the product's URL: /products/<slug>
  slug?: string | null;
  name: string;
  image: string | null;
  images?: string[];
  category?: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  reviews: number;
  // null means not tracked — never coerce it to 0
  stock: number | null;
  description: string;
  ingredients: string[];
}

interface SearchProductsResult {
  success: boolean;
  products: Product[];
  hasMore?: boolean;
  total?: number;
  page?: number;
  message?: string;
}

interface ProductState {
  products: Product[];
  recommended: Product[];
  frequentlyBought: Product[];
  product: Product | null;
  // the slug or id `product` was fetched for: the page only rewrites the URL
  // once the product on screen is the one the URL asked for
  productKey: string | null;
  productNotFound: boolean;
  loading: boolean;
  loadingFrequentlyBought: boolean;

  fetchProducts: () => Promise<unknown>;
  // a slug, or an old numeric id from a link shared before slugs
  fetchSingleProduct: (slugOrId: string) => Promise<void>;
  fetchRecommended: () => Promise<unknown>;
  fetchFrequentlyBought: (id: string) => Promise<unknown>;
  searchProducts: (query: string, page?: number) => Promise<SearchProductsResult>;
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
    // deliberately NOT the `|| 0` idiom above: null here means untracked,
    // and turning it into 0 would mark every existing product sold out
    stock: ((raw) =>
      raw === null || raw === undefined || raw === "" ? null : Number(raw))(
      (source as { stock?: unknown }).stock
    ),
    description: typeof source.description === "string" ? source.description : "",
    image: images[0] || null,
    images,
    ingredients,
  };
};

// the product page's latest request: moving from one product to the next
// quickly must not let the first answer land on the second page
let latestProductRequest = 0;

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  recommended: [],
  frequentlyBought: [],
  product: null,
  productKey: null,
  productNotFound: false,
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

  searchProducts: async (query: string, page = 1) => {
    const { data } = await api.post("/products", { search: query, page, limit: 4 });
    return {
      ...data,
      products: (data.products || []).map((p: unknown) => normalizeProduct(p)),
    };
  },

  fetchSingleProduct: async (slugOrId: string) => {
    const request = ++latestProductRequest;
    // cleared so the page never shows, or redirects to, the previous product
    // while the next one loads
    set({ loading: true, product: null, productKey: null, productNotFound: false });

    try {
      const { data } = await api.post(
        "/products/details",
        isProductId(slugOrId) ? { id: slugOrId } : { slug: slugOrId }
      );
      if (request !== latestProductRequest) return;
      if (data.success) set({ product: normalizeProduct(data.product), productKey: slugOrId });
    } catch (e) {
      if (request !== latestProductRequest) return;
      if (isAxiosError(e) && e.response?.status === 404) set({ productNotFound: true });
      else console.error("Product fetch error", e);
    } finally {
      if (request === latestProductRequest) set({ loading: false });
    }
  },
}));
