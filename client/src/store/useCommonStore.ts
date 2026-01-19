import { create } from "zustand";
import api from "@/lib/api";

/* ================= TYPES ================= */

interface AssetItem {
  image: string | null;
  position: number;
}

interface AssetsState {
  logo: AssetItem[];
  banner: AssetItem[];
  hero: AssetItem[];
}

interface SliderState {
  top: string[];
  bottom: string[];
}

interface StoryState {
  image: string | null;
}

interface SocialsState {
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
}

interface CommonState {
  /* ---------- assets ---------- */
  loadingAssets: boolean;
  assets: AssetsState | null;
  fetchAssets: () => Promise<void>;

  /* ---------- sliders ---------- */
  loadingSliders: boolean;
  sliders: SliderState;
  fetchSliders: () => Promise<void>;

  /* ---------- story ---------- */
  loadingStory: boolean;
  story: StoryState | null;
  fetchStory: () => Promise<void>;

  /* ---------- socials ---------- */
  loadingSocials: boolean;
  socials: SocialsState;
  fetchSocials: () => Promise<void>;
}

/* ================= STORE ================= */

export const useCommonStore = create<CommonState>((set) => ({
  /* ================= ASSETS ================= */
  loadingAssets: false,
  assets: null,

  fetchAssets: async () => {
    try {
      set({ loadingAssets: true });
      const { data } = await api.get("/assets");

      if (data?.success) {
        set({ assets: data.assets });
      }
    } catch (e) {
      console.error("Public assets fetch error", e);
    } finally {
      set({ loadingAssets: false });
    }
  },

  /* ================= SLIDERS ================= */
  loadingSliders: false,
  sliders: {
    top: [],
    bottom: [],
  },

  fetchSliders: async () => {
    try {
      set({ loadingSliders: true });
      const { data } = await api.get("/sliders");

      if (data?.success) {
        set({
          sliders: {
            top: data.sliders.top || [],
            bottom: data.sliders.bottom || [],
          },
        });
      }
    } catch (e) {
      console.error("Public sliders fetch error", e);
    } finally {
      set({ loadingSliders: false });
    }
  },

  /* ================= STORY ================= */
  loadingStory: false,
  story: null,

  fetchStory: async () => {
    try {
      set({ loadingStory: true });
      const { data } = await api.get("/story");

      if (data?.success) {
        set({ story: data.story });
      }
    } catch (e) {
      console.error("Public story fetch error", e);
    } finally {
      set({ loadingStory: false });
    }
  },

  /* ================= SOCIALS ================= */
  loadingSocials: false,
  socials: {},

  fetchSocials: async () => {
    try {
      set({ loadingSocials: true });
      const { data } = await api.get("/socials");

      if (data?.success) {
        set({ socials: data.socials || {} });
      }
    } catch (e) {
      console.error("Public socials fetch error", e);
    } finally {
      set({ loadingSocials: false });
    }
  },
}));
