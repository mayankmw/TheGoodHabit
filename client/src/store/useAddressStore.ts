import { create } from "zustand";
import api from "@/lib/api";

interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: any;

  fetchAddresses: () => Promise<any>;
  createAddress: (payload: Partial<Address>) => Promise<any>;
  updateAddress: (payload: Partial<Address> & { id: number }) => Promise<any>;
  deleteAddress: (id: number) => Promise<any>;
}

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  loading: false,
  error: null,

  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/list");

      set({
        addresses: data.addresses || [],
        loading: false,
      });

      return data;
    } catch (err: any) {
      console.error("fetchAddresses error", err);
      set({
        loading: false,
        error: err?.response?.data || err.message,
      });
      return null;
    }
  },

  createAddress: async (payload) => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/create", payload);

      await get().fetchAddresses();
      set({ loading: false });

      return data;
    } catch (err: any) {
      console.error("createAddress error", err);
      set({
        loading: false,
        error: err?.response?.data || err.message,
      });
      return null;
    }
  },

  updateAddress: async (payload) => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/update", payload);

      await get().fetchAddresses();
      set({ loading: false });

      return data;
    } catch (err: any) {
      console.error("updateAddress error", err);
      set({
        loading: false,
        error: err?.response?.data || err.message,
      });
      return null;
    }
  },

  deleteAddress: async (id) => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/delete", { id });

      await get().fetchAddresses();
      set({ loading: false });

      return data;
    } catch (err: any) {
      console.error("deleteAddress error", err);
      set({
        loading: false,
        error: err?.response?.data || err.message,
      });
      return null;
    }
  },
}));
