import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddressDialog } from "@/components/AddressDialog";
import { useAddressStore } from "@/store/useAddressStore";
import { useAuthStore } from "@/store/useAuthStore";

const formatAddress = (address: { addressLine1: string; city: string; state: string; postalCode: string }) =>
  `${address.addressLine1}, ${address.city}, ${address.state} - ${address.postalCode}`;

// Amazon/Zomato-style delivery address picker for the cart drawer: collapsed
// summary of the selected (default: primary) address, expandable into a
// radio list of every saved address, with "Add new" opening the same global
// AddressDialog used on the Profile page.
export const CartAddressSelector = () => {
  const token = useAuthStore((s) => s.token);
  const addresses = useAddressStore((s) => s.addresses);
  const addressesLoading = useAddressStore((s) => s.loading);
  const fetchAddresses = useAddressStore((s) => s.fetchAddresses);
  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useAddressStore((s) => s.setSelectedAddressId);

  const [expanded, setExpanded] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => {
    if (token) fetchAddresses();
  }, [token, fetchAddresses]);

  // Default to the primary address whenever the list changes and nothing
  // valid is selected yet (first load, or the selected address was deleted).
  useEffect(() => {
    if (!addresses.length) return;
    if (selectedAddressId && addresses.some((a) => a.id === selectedAddressId)) return;

    const primary = addresses.find((a) => a.isPrimary) || addresses[0];
    setSelectedAddressId(primary.id);
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  if (!token) {
    return (
      <div className="mt-4 mb-4 flex items-center gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0" />
        Sign in to choose a delivery address.
      </div>
    );
  }

  const selected = addresses.find((a) => a.id === selectedAddressId) || null;

  return (
    <div className="mt-4 mb-4 rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Deliver to
            </p>
            {selected ? (
              <p className="text-sm font-medium leading-snug">{formatAddress(selected)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {addressesLoading ? "Loading addresses…" : "No saved address yet"}
              </p>
            )}
          </div>
        </div>

        {addresses.length > 0 && (
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            Change
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {expanded && addresses.length > 0 && (
        <div className="mt-4 space-y-2 border-t pt-4">
          {addresses.map((address) => (
            <label
              key={address.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition",
                address.id === selectedAddressId ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <input
                type="radio"
                name="cart-delivery-address"
                className="mt-1 accent-primary"
                checked={address.id === selectedAddressId}
                onChange={() => {
                  setSelectedAddressId(address.id);
                  setExpanded(false);
                }}
              />
              <span className="flex-1">
                {address.isPrimary && (
                  <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    Primary
                  </span>
                )}
                <span className="block">{address.addressLine1}</span>
                {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
                <span className="block text-muted-foreground">
                  {address.city}, {address.state} - {address.postalCode}, {address.country}
                </span>
              </span>
            </label>
          ))}

          <Button type="button" variant="outline" className="w-full" onClick={() => setOpenAdd(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Address
          </Button>
        </div>
      )}

      {!addressesLoading && addresses.length === 0 && (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => setOpenAdd(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Delivery Address
        </Button>
      )}

      <AddressDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        mode="add"
        onSaved={() => {
          // select whatever address just got created (highest id in the
          // freshly-refetched list) instead of leaving the old one selected
          const latest = useAddressStore.getState().addresses;
          if (latest.length) {
            const newest = latest.reduce((max, a) => (a.id > max.id ? a : max), latest[0]);
            setSelectedAddressId(newest.id);
          }
          setExpanded(false);
        }}
      />
    </div>
  );
};
