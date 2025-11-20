import { create } from "zustand";

interface UIState {
  openCart: boolean;
  openSearch: boolean;

  setOpenCart: (v: boolean) => void;
  setOpenSearch: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  openCart: false,
  openSearch: false,

  setOpenCart: (v) => set({ openCart: v }),
  setOpenSearch: (v) => set({ openSearch: v }),
}));
