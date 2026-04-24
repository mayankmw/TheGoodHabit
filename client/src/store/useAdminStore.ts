import { create } from "zustand";
import api from "@/lib/api";

function toNumber(value: any, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  return Number(value);
}

function buildMultipartFormData(payload: Record<string, any>) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "images" && Array.isArray(value)) {
      value.forEach((file) => {
        if (file instanceof File) formData.append("images", file);
      });
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value as any);
  });

  return formData;
}

type DashboardRange = "last7" | "last30" | "lastYear" | "custom";
type DashboardFilterParams = {
  range?: DashboardRange;
  startDate?: string;
  endDate?: string;
};

/* ================= REELS ================= */

interface ReelItem {
  id: number;
  short_video: string;
  short_video_url: string;
  main_video: string;
  main_video_url: string;
  product_id: number;
  product_name?: string;
  active: number;
  sort_order: number;
  views: number;
  likes: number;
  created_at: string;
}

interface AdminState {
  loadingStats: boolean;
  loadingRevenue: boolean;
  loadingOrdersTrend: boolean;

  stats: any;
  revenueLast7Days: { date: string; amount: number }[];
  ordersLast7Days: { date: string; orders: number }[];

  fetchStats: (params?: DashboardFilterParams) => Promise<void>;
  fetchRevenueTrend: (params?: DashboardFilterParams) => Promise<void>;
  fetchOrdersTrend: (params?: DashboardFilterParams) => Promise<void>;

  loadingProducts: boolean;
  loadingProduct: boolean;
  savingProduct: boolean;

  products: any[];
  selectedProduct: any | null;

  fetchProducts: (params?: any) => Promise<void>;
  fetchProductById: (id: string) => Promise<void>;
  createProduct: (payload: any) => Promise<any>;
  updateProduct: (payload: any) => Promise<any>;
  clearSelectedProduct: () => void;

  loadingOrdersList: boolean;
  loadingOrder: boolean;
  updatingOrder: boolean;

  orders: any[];
  selectedOrder: any | null;

  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: number) => Promise<void>;
  updateOrder: (payload: any) => Promise<any>;
  clearSelectedOrder: () => void;

  loadingAssets: boolean;
  savingAsset: boolean;

  assets: any[];

  fetchAssets: () => Promise<void>;
  updateAsset: (payload: any) => Promise<any>;

  loadingCoupons: boolean;
  loadingCoupon: boolean;
  savingCoupon: boolean;
  togglingCoupon: boolean;

  coupons: any[];
  selectedCoupon: any | null;

  fetchCoupons: (params?: any) => Promise<void>;
  fetchCouponById: (id: number) => Promise<void>;
  createCoupon: (payload: any) => Promise<any>;
  updateCoupon: (payload: any) => Promise<any>;
  toggleCoupon: (id: number, active: number) => Promise<any>;
  clearSelectedCoupon: () => void;

  /* ================= SLIDERS ================= */
  loadingSliders: boolean;
  savingSlider: boolean;
  togglingSlider: boolean;
  deletingSlider: boolean;

  sliders: any[];
  selectedSlider: any | null;

  fetchSliders: () => Promise<void>;
  createSlider: (payload: any) => Promise<any>;
  updateSlider: (payload: any) => Promise<any>;
  reorderSliders: (items: { id: number; sort_order: number }[]) => Promise<any>;
  toggleSlider: (id: number, active: number) => Promise<any>;
  deleteSlider: (id: number) => Promise<any>;
  clearSelectedSlider: () => void;

  /* ================= STORY ================= */
  loadingStory: boolean;
  story: any | null;

  fetchStory: () => Promise<void>;
  updateStory: (file: File) => Promise<any>;

  /* ================= SOCIALS ================= */
  loadingSocials: boolean;
  savingSocial: boolean;
  togglingSocial: boolean;

  socials: {
    platform: string;
    url: string;
    active: number;
  }[];

  fetchSocials: () => Promise<void>;
  updateSocial: (platform: string, url: string) => Promise<any>;
  toggleSocial: (platform: string, active: number) => Promise<any>;

  /* ================= CONTACTS ================= */
  loadingContacts: boolean;
  replyingContact: boolean;
  updatingContactStatus: boolean;

  contacts: any[];
  selectedContact: any | null;

  fetchContacts: (params?: {
    search?: string;
    status?: "new" | "read" | "replied";
  }) => Promise<void>;

  markContactRead: (id: number) => Promise<any>;
  replyToContact: (id: number, reply: string) => Promise<any>;
  clearSelectedContact: () => void;

  /* ================= NEWSLETTER ================= */
  loadingSubscribers: boolean;
  loadingNewsletters: boolean;
  sendingNewsletter: boolean;

  subscribers: {
    id: number;
    email: string;
    status: "active" | "unsubscribed";
    active: number;
    subscribedAt: string;
    unsubscribedAt?: string | null;
  }[];

  subscriberStats: {
    total: number;
    active: number;
    unsubscribed: number;
  };

  subscriberPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  newsletters: {
    id: number;
    subject: string;
    content: string;
    sentCount: number;
    failedCount?: number;
    createdAt: string;
  }[];

  fetchNewsletterSubscribers: (params?: {
    search?: string;
    status?: "all" | "active" | "unsubscribed";
    page?: number;
    limit?: number;
  }) => Promise<void>;

  fetchNewsletters: () => Promise<void>;

  sendNewsletter: (payload: FormData | {
    subject: string;
    content: string;
  }) => Promise<any>;

  /* ================= REELS ================= */
  loadingReels: boolean;
  savingReel: boolean;
  togglingReel: boolean;
  deletingReel: boolean;

  reels: ReelItem[];
  selectedReel: ReelItem | null;

  fetchReels: () => Promise<void>;
  createReel: (payload: any) => Promise<any>;
  updateReel: (payload: any) => Promise<any>;
  reorderReels: (items: { id: number; sort_order: number }[]) => Promise<any>;
  toggleReel: (id: number, active: number) => Promise<any>;
  deleteReel: (id: number) => Promise<any>;
  clearSelectedReel: () => void;

}

/* ------------------ store ------------------ */
export const useAdminStore = create<AdminState>((set, get) => ({
  /* ================= LOADERS ================= */
  loadingStats: false,
  loadingRevenue: false,
  loadingOrdersTrend: false,

  /* ================= DATA ================= */
  stats: null,

  revenueLast7Days: [],
  ordersLast7Days: [],

  loadingProducts: false,
  loadingProduct: false,
  savingProduct: false,

  products: [],
  selectedProduct: null,

  loadingOrdersList: false,
  loadingOrder: false,
  updatingOrder: false,

  orders: [],
  selectedOrder: null,

  loadingAssets: false,
  savingAsset: false,

  assets: [],

  loadingCoupons: false,
  loadingCoupon: false,
  savingCoupon: false,
  togglingCoupon: false,

  coupons: [],
  selectedCoupon: null,

  /* ================= SLIDERS ================= */
  loadingSliders: false,
  savingSlider: false,
  togglingSlider: false,
  deletingSlider: false,

  sliders: [],
  selectedSlider: null,

  /* ================= STORY ================= */
  loadingStory: false,
  story: null,

  /* ================= SOCIALS ================= */
  loadingSocials: false,
  savingSocial: false,
  togglingSocial: false,

  socials: [],

  /* ================= CONTACTS ================= */
  loadingContacts: false,
  replyingContact: false,
  updatingContactStatus: false,

  contacts: [],
  selectedContact: null,


  /* ================= NEWSLETTER ================= */
  loadingSubscribers: false,
  loadingNewsletters: false,
  sendingNewsletter: false,

  subscribers: [],
  subscriberStats: {
    total: 0,
    active: 0,
    unsubscribed: 0,
  },
  subscriberPagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  newsletters: [],

  /* ================= REELS ================= */
  loadingReels: false,
  savingReel: false,
  togglingReel: false,
  deletingReel: false,

  reels: [],
  selectedReel: null,


  /* ================= STATS ================= */
  fetchStats: async (params = {}) => {
    try {
      set({ loadingStats: true });
      const { data } = await api.post("/admin/stats", params);
      if (!data.success) return;

      const s = data.stats;

      set({
        stats: {
          orders: {
            total: toNumber(s.orders.total),
            pending: toNumber(s.orders.pending),
            processing: toNumber(s.orders.processing),
            shipped: toNumber(s.orders.shipped),
            delivered: toNumber(s.orders.delivered),
            cancelled: toNumber(s.orders.cancelled),
            todayOrders: toNumber(s.orders.todayOrders, toNumber(s.orders.total)),
          },
          revenue: {
            totalRevenue: toNumber(s.revenue.totalRevenue),
            averageOrderValue: toNumber(s.revenue.averageOrderValue),
            todayRevenue: toNumber(
              s.revenue.todayRevenue,
              toNumber(s.revenue.totalRevenue)
            ),
          },
          users: {
            totalUsers: toNumber(s.users.totalUsers),
            newToday: toNumber(s.users.newToday, toNumber(s.users.totalUsers)),
          },
          products: {
            totalProducts: toNumber(s.products.totalProducts),
          },
        },
      });
    } catch (e) {
      console.log("Stats fetch error", e);
    } finally {
      set({ loadingStats: false });
    }
  },

  /* ================= REVENUE TREND ================= */
  fetchRevenueTrend: async (params = {}) => {
    try {
      set({ loadingRevenue: true });
      const { data } = await api.post("/admin/trends/revenue", params);
      const revenueSeries = data.revenueTrend || data.revenueLast7Days || [];

      set({
        revenueLast7Days: revenueSeries.map((r: any) => ({
          date: r.date,
          amount: toNumber(r.amount),
        })),
      });
    } catch (e) {
      console.log("Revenue trend error", e);
    } finally {
      set({ loadingRevenue: false });
    }
  },

  /* ================= ORDERS TREND ================= */
  fetchOrdersTrend: async (params = {}) => {
    try {
      set({ loadingOrdersTrend: true });
      const { data } = await api.post("/admin/trends/orders", params);
      const ordersSeries = data.ordersTrend || data.ordersLast7Days || [];

      set({
        ordersLast7Days: ordersSeries.map((r: any) => ({
          date: r.date,
          orders: toNumber(r.orders),
        })),
      });
    } catch (e) {
      console.log("Orders trend error", e);
    } finally {
      set({ loadingOrdersTrend: false });
    }
  },

  /* ================= PRODUCTS ================= */
  fetchProducts: async (params = {}) => {
    try {
      set({ loadingProducts: true });
      const { data } = await api.get("/admin/products", { params });
      if (!data.success) return;

      set({ products: data.products || [] });
    } catch (e) {
      console.log("Products fetch error", e);
    } finally {
      set({ loadingProducts: false });
    }
  },

  fetchProductById: async (id) => {
    try {
      set({ loadingProduct: true, selectedProduct: null });
      const { data } = await api.post("/admin/product", { id });
      if (!data.success) return;

      set({ selectedProduct: data.product });
    } catch (e) {
      console.log("Product fetch error", e);
    } finally {
      set({ loadingProduct: false });
    }
  },

  createProduct: async (payload) => {
    try {
      set({ savingProduct: true });

      const formData = buildMultipartFormData(payload);

      const { data } = await api.post("/admin/product/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) get().fetchProducts();
      return data;
    } catch (e) {
      console.log("Create product error", e);
      return { success: false };
    } finally {
      set({ savingProduct: false });
    }
  },

  updateProduct: async (payload) => {
    try {
      set({ savingProduct: true });

      const formData = buildMultipartFormData(payload);

      const { data } = await api.post("/admin/product/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) get().fetchProducts();
      return data;
    } catch (e) {
      console.log("Update product error", e);
      return { success: false };
    } finally {
      set({ savingProduct: false });
    }
  },

  clearSelectedProduct: () => set({ selectedProduct: null }),

  /* ================= ORDERS ================= */
  fetchOrders: async () => {
    try {
      set({ loadingOrdersList: true });
      const { data } = await api.post("/admin/orders");
      if (!data.success) return;

      set({ orders: data.orders || [] });
    } catch (e) {
      console.log("Fetch orders error", e);
    } finally {
      set({ loadingOrdersList: false });
    }
  },

  fetchOrderById: async (id) => {
    try {
      set({ loadingOrder: true, selectedOrder: null });
      const { data } = await api.post("/admin/order", { id });
      if (!data.success) return;

      set({ selectedOrder: data.order });
    } catch (e) {
      console.log("Fetch order error", e);
    } finally {
      set({ loadingOrder: false });
    }
  },

  updateOrder: async (payload) => {
    try {
      set({ updatingOrder: true });
      const { data } = await api.post("/admin/order/update", payload);

      if (data.success) {
        get().fetchOrders();
        if (payload.id) get().fetchOrderById(payload.id);
      }
      return data;
    } catch (e) {
      console.log("Update order error", e);
      return { success: false };
    } finally {
      set({ updatingOrder: false });
    }
  },

  clearSelectedOrder: () => set({ selectedOrder: null }),

  fetchAssets: async () => {
    try {
      set({ loadingAssets: true });
      const { data } = await api.post("/admin/assets");
      if (!data.success) return;

      set({ assets: data.assets || [] });
    } catch (e) {
      console.log("Assets fetch error", e);
    } finally {
      set({ loadingAssets: false });
    }
  },

  updateAsset: async (payload) => {
    try {
      set({ savingAsset: true });

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value as any);
      });

      const { data } = await api.post("/admin/assets/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) get().fetchAssets();
      return data;
    } catch (e) {
      console.log("Update asset error", e);
      return { success: false };
    } finally {
      set({ savingAsset: false });
    }
  },

  fetchCoupons: async (params = {}) => {
    try {
      set({ loadingCoupons: true });
      const { data } = await api.post("/admin/coupons", params);
      if (!data.success) return;

      set({ coupons: data.coupons || [] });
    } catch (e) {
      console.log("Fetch coupons error", e);
    } finally {
      set({ loadingCoupons: false });
    }
  },

  fetchCouponById: async (id) => {
    try {
      set({ loadingCoupon: true, selectedCoupon: null });
      const { data } = await api.post("/admin/coupon", { id });
      if (!data.success) return;

      set({ selectedCoupon: data.coupon });
    } catch (e) {
      console.log("Fetch coupon error", e);
    } finally {
      set({ loadingCoupon: false });
    }
  },

  createCoupon: async (payload) => {
    try {
      set({ savingCoupon: true });

      const { data } = await api.post("/admin/coupon/create", payload);

      if (data.success) {
        get().fetchCoupons();
      }

      return data;
    } catch (e) {
      console.log("Create coupon error", e);
      return { success: false };
    } finally {
      set({ savingCoupon: false });
    }
  },

  updateCoupon: async (payload) => {
    try {
      set({ savingCoupon: true });

      const { data } = await api.post("/admin/coupon/update", payload);

      if (data.success) {
        get().fetchCoupons();
        if (payload.id) get().fetchCouponById(payload.id);
      }

      return data;
    } catch (e) {
      console.log("Update coupon error", e);
      return { success: false };
    } finally {
      set({ savingCoupon: false });
    }
  },

  toggleCoupon: async (id, active) => {
    try {
      set({ togglingCoupon: true });

      const { data } = await api.post("/admin/coupon/toggle", {
        id,
        active,
      });

      if (data.success) {
        get().fetchCoupons();
      }

      return data;
    } catch (e) {
      console.log("Toggle coupon error", e);
      return { success: false };
    } finally {
      set({ togglingCoupon: false });
    }
  },

  clearSelectedCoupon: () => set({ selectedCoupon: null }),

  fetchSliders: async () => {
    try {
      set({ loadingSliders: true });
      const { data } = await api.post("/admin/sliders");

      if (!data.success) return;

      set({ sliders: data.sliders || [] });
    } catch (e) {
      console.log("Fetch sliders error", e);
    } finally {
      set({ loadingSliders: false });
    }
  },

  createSlider: async (payload) => {
    try {
      set({ savingSlider: true });

      const { data } = await api.post("/admin/slider/create", payload);

      if (data.success) {
        get().fetchSliders();
      }

      return data;
    } catch (e) {
      console.log("Create slider error", e);
      return { success: false };
    } finally {
      set({ savingSlider: false });
    }
  },

  updateSlider: async (payload) => {
    try {
      set({ savingSlider: true });

      const { data } = await api.post("/admin/slider/update", payload);

      if (data.success) {
        get().fetchSliders();
      }

      return data;
    } catch (e) {
      console.log("Update slider error", e);
      return { success: false };
    } finally {
      set({ savingSlider: false });
    }
  },

  reorderSliders: async (items) => {
    try {
      const { data } = await api.post("/admin/slider/reorder", { items });

      if (data.success) {
        get().fetchSliders();
      }

      return data;
    } catch (e) {
      console.log("Reorder slider error", e);
      return { success: false };
    }
  },

  toggleSlider: async (id, active) => {
    try {
      set({ togglingSlider: true });

      const { data } = await api.post("/admin/slider/toggle", {
        id,
        active,
      });

      if (data.success) {
        get().fetchSliders();
      }

      return data;
    } catch (e) {
      console.log("Toggle slider error", e);
      return { success: false };
    } finally {
      set({ togglingSlider: false });
    }
  },

  deleteSlider: async (id) => {
    try {
      set({ deletingSlider: true });

      const { data } = await api.post("/admin/slider/delete", { id });

      if (data.success) {
        get().fetchSliders();
      }

      return data;
    } catch (e) {
      console.log("Delete slider error", e);
      return { success: false };
    } finally {
      set({ deletingSlider: false });
    }
  },

  clearSelectedSlider: () => set({ selectedSlider: null }),

  fetchStory: async () => {
    try {
      set({ loadingStory: true });

      const { data } = await api.post("/admin/story");
      if (!data?.success) return;

      set({ story: data.story });
    } catch (e) {
      console.error("Fetch story error", e);
    } finally {
      set({ loadingStory: false });
    }
  },

  updateStory: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const { data } = await api.post(
        "/admin/story/update",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (data.success) {
        get().fetchStory();
      }

      return data;
    } catch (e) {
      console.error("Update story error", e);
      return { success: false };
    }
  },

  fetchSocials: async () => {
    try {
      set({ loadingSocials: true });

      const { data } = await api.post("/admin/socials");
      if (!data?.success) return;

      set({ socials: data.socials || [] });
    } catch (e) {
      console.error("Fetch socials error", e);
    } finally {
      set({ loadingSocials: false });
    }
  },

  updateSocial: async (platform, url) => {
    try {
      set({ savingSocial: true });

      const { data } = await api.post("/admin/social/update", {
        platform,
        url,
      });

      if (data.success) {
        get().fetchSocials();
      }

      return data;
    } catch (e) {
      console.error("Update social error", e);
      return { success: false };
    } finally {
      set({ savingSocial: false });
    }
  },

  toggleSocial: async (platform, active) => {
    try {
      set({ togglingSocial: true });

      const { data } = await api.post("/admin/social/toggle", {
        platform,
        active,
      });

      if (data.success) {
        get().fetchSocials();
      }

      return data;
    } catch (e) {
      console.error("Toggle social error", e);
      return { success: false };
    } finally {
      set({ togglingSocial: false });
    }
  },

  /* ================= CONTACTS ================= */

  fetchContacts: async (params = {}) => {
    try {
      set({ loadingContacts: true });

      const { data } = await api.post("/admin/contacts", params);
      if (!data?.success) return;

      set({
        contacts: data.contacts || [],
      });
    } catch (e) {
      console.error("Fetch contacts error", e);
    } finally {
      set({ loadingContacts: false });
    }
  },

  markContactRead: async (id: number) => {
    try {
      set({ updatingContactStatus: true });

      const { data } = await api.post("/admin/contact/read", { id });

      if (data.success) {
        get().fetchContacts();
      }

      return data;
    } catch (e) {
      console.error("Mark contact read error", e);
      return { success: false };
    } finally {
      set({ updatingContactStatus: false });
    }
  },

  replyToContact: async (id: number, reply: string) => {
    try {
      set({ replyingContact: true });

      const { data } = await api.post("/admin/contact/reply", {
        id,
        reply,
      });

      if (data.success) {
        get().fetchContacts();
      }

      return data;
    } catch (e) {
      console.error("Reply contact error", e);
      return { success: false };
    } finally {
      set({ replyingContact: false });
    }
  },

  clearSelectedContact: () => set({ selectedContact: null }),

  /* ================= NEWSLETTER ================= */

  fetchNewsletterSubscribers: async (params = {}) => {
    try {
      set({ loadingSubscribers: true });

      const { data } = await api.post(
        "/admin/newsletters/subscribers",
        params
      );

      if (!data?.success) return;

      set({
        subscribers: data.subscribers || [],
        subscriberStats: data.stats || {
          total: 0,
          active: 0,
          unsubscribed: 0,
        },
        subscriberPagination: data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        },
      });
    } catch (e) {
      console.error("Fetch newsletter subscribers error", e);
    } finally {
      set({ loadingSubscribers: false });
    }
  },

  fetchNewsletters: async () => {
    try {
      set({ loadingNewsletters: true });

      const { data } = await api.post("/admin/newsletters");
      if (!data?.success) return;

      set({
        newsletters: data.newsletters || [],
      });
    } catch (e) {
      console.error("Fetch newsletters error", e);
    } finally {
      set({ loadingNewsletters: false });
    }
  },

  sendNewsletter: async (payload) => {
    try {
      set({ sendingNewsletter: true });

      const config =
        payload instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined;

      const { data } = await api.post(
        "/admin/newsletter/send",
        payload,
        config
      );

      if (data.success) {
        get().fetchNewsletters();
      }

      return data;
    } catch (e) {
      console.error("Send newsletter error", e);
      return { success: false };
    } finally {
      set({ sendingNewsletter: false });
    }
  },

  fetchReels: async () => {
    try {
      set({ loadingReels: true });

      const { data } = await api.post("/admin/reels");
      if (!data?.success) return;

      set({ reels: data.reels || [] });
    } catch (e) {
      console.error("Fetch reels error", e);
    } finally {
      set({ loadingReels: false });
    }
  },

  createReel: async (payload) => {
    try {
      set({ savingReel: true });

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value as any);
      });

      const { data } = await api.post(
        "/admin/reel/create",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (data.success) {
        get().fetchReels();
      }

      return data;
    } catch (e) {
      console.error("Create reel error", e);
      return { success: false };
    } finally {
      set({ savingReel: false });
    }
  },

  updateReel: async (payload) => {
    try {
      set({ savingReel: true });

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, value as any);
      });

      const { data } = await api.post(
        "/admin/reel/update",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (data.success) {
        get().fetchReels();
      }

      return data;
    } catch (e) {
      console.error("Update reel error", e);
      return { success: false };
    } finally {
      set({ savingReel: false });
    }
  },

  reorderReels: async (items) => {
    try {
      const { data } = await api.post("/admin/reel/reorder", { items });

      if (data.success) {
        get().fetchReels();
      }
      return data;
    } catch (e) {
      console.log("Reorder slider error", e);
      return { success: false };
    }
  },

  toggleReel: async (id, active) => {
    try {
      set({ togglingReel: true });

      const { data } = await api.post("/admin/reel/toggle", {
        id,
        active,
      });

      if (data.success) {
        get().fetchReels();
      }

      return data;
    } catch (e) {
      console.error("Toggle reel error", e);
      return { success: false };
    } finally {
      set({ togglingReel: false });
    }
  },

  deleteReel: async (id) => {
    try {
      set({ deletingReel: true });

      const { data } = await api.post("/admin/reel/delete", { id });

      if (data.success) {
        get().fetchReels();
      }

      return data;
    } catch (e) {
      console.error("Delete reel error", e);
      return { success: false };
    } finally {
      set({ deletingReel: false });
    }
  },

  clearSelectedReel: () => set({ selectedReel: null }),
}));
