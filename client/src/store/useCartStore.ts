import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
}

interface CartState {
  cart: CartItem[];

  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addToCart: (product) => {
    const cart = get().cart;
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      const updated = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      set({ cart: updated });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
  },

  removeFromCart: (id) => {
    set({ cart: get().cart.filter((item) => item.id !== id) });
  },

  updateQuantity: (id, qty) => {
    set({
      cart: get().cart.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      ),
    });
  },

  clearCart: () => set({ cart: [] }),
}));
