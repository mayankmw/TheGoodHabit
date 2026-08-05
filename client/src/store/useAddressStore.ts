import { create } from "zustand";
import api from "@/lib/api";

export interface Address {
  id: number;
  addressLine1: string;
  addressLine2?: string | null;
  phone?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
}

type AddressResponse = {
  success?: boolean;
  message?: string;
  addresses?: Address[];
};

type AddressPayload = Partial<Address>;

type AddressUpdatePayload = Partial<Address> & { id: number };

type StoreError = {
  response?: {
    data?: AddressResponse;
  };
  message?: string;
};

interface AddressState {
  addresses: Address[];
  loading: boolean;
  error: AddressResponse | string | null;

  // Which address is currently chosen for delivery (e.g. in the cart).
  // Not persisted — each session defaults back to the primary address.
  selectedAddressId: number | null;
  setSelectedAddressId: (id: number | null) => void;

  fetchAddresses: () => Promise<AddressResponse | null>;
  createAddress: (payload: AddressPayload) => Promise<AddressResponse | null>;
  updateAddress: (payload: AddressUpdatePayload) => Promise<AddressResponse | null>;
  deleteAddress: (id: number) => Promise<AddressResponse | null>;
  setPrimaryAddress: (id: number) => Promise<AddressResponse | null>;
}

const normalizeAddress = (address: Address | (Omit<Address, "isPrimary"> & { isPrimary: number | boolean })): Address => ({
  ...address,
  isPrimary: Boolean(address.isPrimary),
});

const normalizeAddresses = (addresses?: Array<Address | (Omit<Address, "isPrimary"> & { isPrimary: number | boolean })>) =>
  (addresses || []).map(normalizeAddress);

export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  loading: false,
  error: null,

  selectedAddressId: null,
  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  fetchAddresses: async () => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/list");

      set({
        addresses: normalizeAddresses(data.addresses),
        loading: false,
      });

      return data;
    } catch (err: unknown) {
      const error = err as StoreError;
      console.error("fetchAddresses error", err);
      set({
        loading: false,
        error: error?.response?.data || error.message || "Something went wrong",
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
    } catch (err: unknown) {
      const error = err as StoreError;
      console.error("createAddress error", err);
      set({
        loading: false,
        error: error?.response?.data || error.message || "Something went wrong",
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
    } catch (err: unknown) {
      const error = err as StoreError;
      console.error("updateAddress error", err);
      set({
        loading: false,
        error: error?.response?.data || error.message || "Something went wrong",
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

      // deleted address can't stay selected — let it re-default to primary
      if (get().selectedAddressId === id) {
        set({ selectedAddressId: null });
      }

      return data;
    } catch (err: unknown) {
      const error = err as StoreError;
      console.error("deleteAddress error", err);
      set({
        loading: false,
        error: error?.response?.data || error.message || "Something went wrong",
      });
      return null;
    }
  },

  setPrimaryAddress: async (id) => {
    try {
      set({ loading: true, error: null });

      const { data } = await api.post("/address/set-primary", { id });

      if (data.addresses) {
        set({
          addresses: normalizeAddresses(data.addresses),
          loading: false,
        });
      } else {
        await get().fetchAddresses();
        set({ loading: false });
      }

      return data;
    } catch (err: unknown) {
      const error = err as StoreError;
      console.error("setPrimaryAddress error", err);
      set({
        loading: false,
        error: error?.response?.data || error.message || "Something went wrong",
      });
      return null;
    }
  },
}));
