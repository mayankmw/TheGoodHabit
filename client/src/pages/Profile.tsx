import { useEffect, useState } from "react";
import {
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Plus,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useAddressStore } from "@/store/useAddressStore";

type AddressDraft = {
  id?: number;
  addressLine: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

const emptyAddressDraft = (): AddressDraft => ({
  addressLine: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

function AddressForm({
  draft,
  onChange,
}: {
  draft: AddressDraft | null;
  onChange: (value: AddressDraft) => void;
}) {
  if (!draft) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Address Line 1</Label>
        <Input
          value={draft.addressLine}
          onChange={(e) => onChange({ ...draft, addressLine: e.target.value })}
          placeholder="House no, street, landmark"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Address Line 2</Label>
        <Input
          value={draft.addressLine2}
          onChange={(e) => onChange({ ...draft, addressLine2: e.target.value })}
          placeholder="Apartment, area, optional details"
        />
      </div>

      <div className="space-y-2">
        <Label>Pincode</Label>
        <Input
          value={draft.pincode}
          onChange={(e) => onChange({ ...draft, pincode: e.target.value })}
          placeholder="110001"
        />
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={draft.city}
          onChange={(e) => onChange({ ...draft, city: e.target.value })}
          placeholder="New Delhi"
        />
      </div>

      <div className="space-y-2">
        <Label>State</Label>
        <Input
          value={draft.state}
          onChange={(e) => onChange({ ...draft, state: e.target.value })}
          placeholder="Delhi"
        />
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <Input
          value={draft.country}
          onChange={(e) => onChange({ ...draft, country: e.target.value })}
          placeholder="India"
        />
      </div>
    </div>
  );
}

export const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  const {
    addresses,
    loading: addressesLoading,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddressStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState<AddressDraft | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        await fetchMe();
        await fetchAddresses();
      } finally {
        setPageLoading(false);
      }
    };

    load();
  }, [fetchAddresses, fetchMe]);

  const handleAddAddress = async () => {
    if (!draft) return;

    const res = await createAddress({
      addressLine1: draft.addressLine,
      addressLine2: draft.addressLine2 || null,
      city: draft.city,
      state: draft.state,
      postalCode: draft.pincode,
      country: draft.country || "India",
    });

    if (res?.success) {
      toast.success(res.message);
      setOpenAdd(false);
      setDraft(null);
    } else {
      toast.error(res?.message || "Failed to add address");
    }
  };

  const handleEditAddress = async () => {
    if (!draft?.id) return;

    const res = await updateAddress({
      id: draft.id,
      addressLine1: draft.addressLine,
      addressLine2: draft.addressLine2 || null,
      city: draft.city,
      state: draft.state,
      postalCode: draft.pincode,
      country: draft.country || "India",
    });

    if (res?.success) {
      toast.success(res.message);
      setOpenEdit(false);
      setDraft(null);
    } else {
      toast.error(res?.message || "Failed to update address");
    }
  };

  const handleDelete = async (id: number) => {
    const res = await deleteAddress(id);

    if (res?.success) {
      toast.success(res.message);
    } else {
      toast.error(res?.message || "Failed to delete address");
    }
  };

  const openCreateDialog = () => {
    setDraft(emptyAddressDraft());
    setOpenAdd(true);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--secondary)/0.16)_0%,hsl(var(--background))_38%,hsl(var(--background))_100%)] px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[28px] border bg-card/90 p-8 shadow-sm">
            <div className="h-8 w-52 animate-pulse rounded-full bg-secondary/40" />
            <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-8 rounded-[28px] border bg-card p-8 shadow-sm">
            <div className="h-6 w-40 animate-pulse rounded-full bg-secondary/40" />
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="h-28 animate-pulse rounded-3xl bg-muted/70" />
              <div className="h-28 animate-pulse rounded-3xl bg-muted/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--secondary)/0.16)_0%,hsl(var(--background))_38%,hsl(var(--background))_100%)] px-4 py-14 md:px-6">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[32px] border border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--secondary)/0.55),transparent_34%),linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--card))_50%,hsl(var(--secondary)/0.28)_100%)] p-8 shadow-[0_24px_80px_-42px_hsl(var(--primary)/0.42)] md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
                NoshBOB Account
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground md:text-5xl">
                {user?.name ? `${user.name}, your profile is ready.` : "Your profile is ready."}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Manage your account details, keep delivery addresses updated, and jump straight into your latest orders from one clean space.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                onClick={() => navigate("/orders")}
              >
                <Package className="mr-2 h-4 w-4" />
                View My Orders
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-primary/20 bg-background/80 text-primary hover:bg-primary/5"
                onClick={() => navigate("/track-order")}
              >
                <Truck className="mr-2 h-4 w-4" />
                Track Order
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-border bg-background/80 text-foreground hover:bg-muted"
                onClick={() => {
                  logout(() => navigate("/signin"));
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <aside>
            <section className="rounded-[28px] border bg-card/95 p-6 shadow-sm backdrop-blur md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Account Overview
                  </p>
                  <h2 className="text-2xl font-bold text-primary">
                    {user?.name || "Good Habit User"}
                  </h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-[24px] border bg-background p-5">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{user?.email || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border bg-[linear-gradient(135deg,hsl(var(--primary)/0.08)_0%,hsl(var(--secondary)/0.22)_100%)] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Saved Addresses
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black text-foreground">{addresses.length}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Delivery locations ready for checkout
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full border-primary/20 bg-background/85 text-primary hover:bg-primary/5"
                      onClick={openCreateDialog}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Address
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          <section className="rounded-[28px] border bg-card/95 p-6 shadow-sm backdrop-blur md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Delivery Details
                </p>
                <h2 className="mt-2 text-2xl font-bold text-primary">Saved Addresses</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Save multiple addresses for faster checkout and easier order management.
                </p>
              </div>

              <Button className="rounded-full px-6" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Address
              </Button>
            </div>

            {addressesLoading ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="h-48 animate-pulse rounded-[24px] border bg-muted/60" />
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="mt-8 rounded-[28px] border border-dashed border-primary/20 bg-[linear-gradient(135deg,hsl(var(--primary)/0.04)_0%,hsl(var(--secondary)/0.22)_100%)] p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-background text-primary shadow-sm">
                  <MapPin className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-primary">No saved addresses yet</h3>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Add your first delivery address so checkout feels fast and your next order reaches the right place without extra typing.
                </p>
                <Button className="mt-6 rounded-full px-6" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Address
                </Button>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {addresses.map((address, index) => (
                  <article
                    key={address.id}
                    className="group rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--secondary)/0.12)_100%)] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                          {index === 0 ? "Primary Address" : `Address ${index + 1}`}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {user?.name || "Account Address"}
                        </h3>
                      </div>
                      <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => {
                            setDraft({
                              id: address.id,
                              addressLine: address.addressLine1,
                              addressLine2: address.addressLine2 || "",
                              city: address.city,
                              state: address.state,
                              pincode: address.postalCode,
                              country: address.country || "India",
                            });
                            setOpenEdit(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-foreground/85">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} - {address.postalCode}
                      </p>
                      <p className="text-muted-foreground">{address.country}</p>
                    </div>

                    <div className="mt-6 flex gap-3 md:hidden">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={() => {
                          setDraft({
                            id: address.id,
                            addressLine: address.addressLine1,
                            addressLine2: address.addressLine2 || "",
                            city: address.city,
                            state: address.state,
                            pincode: address.postalCode,
                            country: address.country || "India",
                          });
                          setOpenEdit(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 rounded-full"
                        onClick={() => handleDelete(address.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <Dialog
        open={openAdd}
        onOpenChange={(value) => {
          setOpenAdd(value);
          if (!value) setDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>

          <AddressForm draft={draft} onChange={setDraft} />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAddress}>Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={(value) => {
          setOpenEdit(value);
          if (!value) setDraft(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>

          <AddressForm draft={draft} onChange={setDraft} />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAddress}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
