import { create } from "zustand";
import api from "@/lib/api";

function toNumber(value: any, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  return Number(value);
}

interface AdminState {
  loadingStats: boolean;
  loadingRevenue: boolean;
  loadingOrdersTrend: boolean;

  stats: any;
  revenueLast7Days: { date: string; amount: number }[];
  ordersLast7Days: { date: string; orders: number }[];

  fetchStats: () => Promise<void>;
  fetchRevenueTrend: () => Promise<void>;
  fetchOrdersTrend: () => Promise<void>;

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


  /* ================= STATS ================= */
  fetchStats: async () => {
    try {
      set({ loadingStats: true });
      const { data } = await api.post("/admin/stats");
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
            todayOrders: toNumber(s.orders.todayOrders),
          },
          revenue: {
            totalRevenue: toNumber(s.revenue.totalRevenue),
            averageOrderValue: toNumber(s.revenue.averageOrderValue),
            todayRevenue: toNumber(s.revenue.todayRevenue),
          },
          users: {
            totalUsers: toNumber(s.users.totalUsers),
            newToday: toNumber(s.users.newToday),
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
  fetchRevenueTrend: async () => {
    try {
      set({ loadingRevenue: true });
      const { data } = await api.post("/admin/trends/revenue");

      set({
        revenueLast7Days: data.revenueLast7Days.map((r: any) => ({
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
  fetchOrdersTrend: async () => {
    try {
      set({ loadingOrdersTrend: true });
      const { data } = await api.post("/admin/trends/orders");

      set({
        ordersLast7Days: data.ordersLast7Days.map((r: any) => ({
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

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as any);
        }
      });

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

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as any);
        }
      });

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


}));
