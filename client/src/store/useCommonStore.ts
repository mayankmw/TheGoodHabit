import { create } from "zustand";
import api from "@/lib/api";

interface AssetItem {
  image: string | null;
  position: number;
}

interface AssetsState {
  logo: AssetItem[];
  banner: AssetItem[];
  hero: AssetItem[];
}

interface CommonState {
  loadingAssets: boolean;
  assets: AssetsState | null;

  fetchAssets: () => Promise<void>;
}

export const useCommonStore = create<CommonState>((set) => ({
  loadingAssets: false,
  assets: null,

  fetchAssets: async () => {
    try {
      set({ loadingAssets: true });

      const { data } = await api.get("/assets");
      if (!data?.success) return;

      set({
        assets: data.assets,
      });
    } catch (e) {
      console.error("Public assets fetch error", e);
    } finally {
      set({ loadingAssets: false });
    }
  },
}));
