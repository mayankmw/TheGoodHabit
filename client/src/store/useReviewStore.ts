import { create } from "zustand";
import api from "@/lib/api";

export interface ProductReview {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: string;
  verified: boolean;
}

export interface ReviewSummary {
  total: number;
  average: number;
  breakdown: Record<string, number>;
}

interface ReviewState {
  productId: string | null;
  reviews: ProductReview[];
  summary: ReviewSummary;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;

  fetchReviews: (productId: string | number) => Promise<void>;
  loadMore: () => Promise<void>;
}

// 6 divides evenly by the 2- and 3-column grid, so a page never half-fills a row
const PAGE_SIZE = 6;

const emptySummary = (): ReviewSummary => ({
  total: 0,
  average: 0,
  breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
});

// Reviews live in their own store rather than useProductStore: Product.tsx
// destructures that store wholesale, so a reviews fetch there would re-render
// the gallery and every animated block, and its shared `loading` flag
// blanks the entire page.
export const useReviewStore = create<ReviewState>((set, get) => ({
  productId: null,
  reviews: [],
  summary: emptySummary(),
  page: 1,
  hasMore: false,
  loading: false,
  loadingMore: false,

  fetchReviews: async (productId) => {
    const key = String(productId);

    // clear first — /products/:id has no route key, so navigating product A to
    // product B never unmounts the page and A's reviews would otherwise show
    // under B's name for a frame
    set({
      productId: key,
      reviews: [],
      summary: emptySummary(),
      page: 1,
      hasMore: false,
      loading: true,
    });

    try {
      const { data } = await api.post("/reviews/product", {
        productId: key,
        page: 1,
        limit: PAGE_SIZE,
      });

      // a slow response for the product we just navigated away from must not
      // overwrite the one on screen
      if (get().productId !== key) return;

      if (!data?.success) {
        set({ loading: false });
        return;
      }

      set({
        reviews: data.reviews || [],
        summary: data.summary || emptySummary(),
        hasMore: Boolean(data.hasMore),
        loading: false,
      });
    } catch (err) {
      console.error("fetchReviews error", err);
      if (get().productId !== key) return;
      set({ loading: false });
    }
  },

  loadMore: async () => {
    const { productId, page, hasMore, loadingMore } = get();
    if (!productId || !hasMore || loadingMore) return;

    const nextPage = page + 1;
    set({ loadingMore: true });

    try {
      const { data } = await api.post("/reviews/product", {
        productId,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      if (get().productId !== productId) return;

      if (!data?.success) {
        set({ loadingMore: false });
        return;
      }

      // page only advances on success, so a failed request retries the same
      // page instead of skipping it forever
      set((state) => ({
        reviews: [...state.reviews, ...(data.reviews || [])],
        hasMore: Boolean(data.hasMore),
        page: nextPage,
        loadingMore: false,
      }));
    } catch (err) {
      console.error("loadMore reviews error", err);
      if (get().productId !== productId) return;
      set({ loadingMore: false });
    }
  },
}));
