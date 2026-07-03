import { useEffect, useState } from "react";
import {
  Check,
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
import { cn } from "@/lib/utils";
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

type AddressField = keyof AddressDraft;

type AddressErrors = Partial<Record<Exclude<AddressField, "id" | "addressLine2">, string>>;

const emptyAddressDraft = (): AddressDraft => ({
  addressLine: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

const PINCODE_REGEX = /^\d{6}$/;

const sanitizeAddressDraft = (draft: AddressDraft): AddressDraft => ({
  ...draft,
  addressLine: draft.addressLine.trim(),
  addressLine2: draft.addressLine2.trim(),
  city: draft.city.trim(),
  state: draft.state.trim(),
  pincode: draft.pincode.replace(/\D/g, "").slice(0, 6),
  country: draft.country.trim(),
});

const validateAddressDraft = (draft: AddressDraft | null): AddressErrors => {
  if (!draft) return {};

  const normalized = sanitizeAddressDraft(draft);
  const errors: AddressErrors = {};

  if (!normalized.addressLine) {
    errors.addressLine = "Address line 1 is required";
  }

  if (!normalized.city) {
    errors.city = "City is required";
  }

  if (!normalized.state) {
    errors.state = "State is required";
  }

  if (!normalized.country) {
    errors.country = "Country is required";
  }

  if (!normalized.pincode) {
    errors.pincode = "Pincode is required";
  } else if (!PINCODE_REGEX.test(normalized.pincode)) {
    errors.pincode = "Pincode must be exactly 6 digits";
  }

  return errors;
};

function AddressForm({
  draft,
  onChange,
  errors,
  touchedFields,
  onFieldBlur,
}: {
  draft: AddressDraft | null;
  onChange: (value: AddressDraft) => void;
  errors: AddressErrors;
  touchedFields: Partial<Record<AddressField, boolean>>;
  onFieldBlur: (field: AddressField) => void;
}) {
  if (!draft) return null;

  const showFieldError = (field: keyof AddressErrors) =>
    Boolean(touchedFields[field] && errors[field]);

  const inputClassName = (field: keyof AddressErrors) =>
    cn(showFieldError(field) && "border-destructive focus-visible:ring-destructive");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label>Address Line 1</Label>
        <Input
          value={draft.addressLine}
          onChange={(e) => onChange({ ...draft, addressLine: e.target.value })}
          onBlur={() => onFieldBlur("addressLine")}
          placeholder="House no, street, landmark"
          className={inputClassName("addressLine")}
        />
        {showFieldError("addressLine") ? (
          <p className="text-sm text-destructive">{errors.addressLine}</p>
        ) : null}
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Address Line 2</Label>
        <Input
          value={draft.addressLine2}
          onChange={(e) => onChange({ ...draft, addressLine2: e.target.value })}
          onBlur={() => onFieldBlur("addressLine2")}
          placeholder="Apartment, area, optional details"
        />
      </div>

      <div className="space-y-2">
        <Label>Pincode</Label>
        <Input
          value={draft.pincode}
          onChange={(e) =>
            onChange({
              ...draft,
              pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
            })
          }
          onBlur={() => onFieldBlur("pincode")}
          placeholder="110001"
          inputMode="numeric"
          maxLength={6}
          className={inputClassName("pincode")}
        />
        {showFieldError("pincode") ? (
          <p className="text-sm text-destructive">{errors.pincode}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>City</Label>
        <Input
          value={draft.city}
          onChange={(e) => onChange({ ...draft, city: e.target.value })}
          onBlur={() => onFieldBlur("city")}
          placeholder="New Delhi"
          className={inputClassName("city")}
        />
        {showFieldError("city") ? (
          <p className="text-sm text-destructive">{errors.city}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>State</Label>
        <Input
          value={draft.state}
          onChange={(e) => onChange({ ...draft, state: e.target.value })}
          onBlur={() => onFieldBlur("state")}
          placeholder="Delhi"
          className={inputClassName("state")}
        />
        {showFieldError("state") ? (
          <p className="text-sm text-destructive">{errors.state}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Country</Label>
        <Input
          value={draft.country}
          onChange={(e) => onChange({ ...draft, country: e.target.value })}
          onBlur={() => onFieldBlur("country")}
          placeholder="India"
          className={inputClassName("country")}
        />
        {showFieldError("country") ? (
          <p className="text-sm text-destructive">{errors.country}</p>
        ) : null}
      </div>
    </div>
  );
}

export const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const authLoading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);

  const {
    addresses,
    loading: addressesLoading,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress,
  } = useAddressStore();

  const [pageLoading, setPageLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [draft, setDraft] = useState<AddressDraft | null>(null);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<AddressField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const navigate = useNavigate();

  const validationErrors = validateAddressDraft(draft);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const trimmedName = user?.name?.trim() || "";
  const normalizedNameDraft = nameDraft.trim();
  const hasName = Boolean(trimmedName);
  const hasAddress = addresses.length > 0;

  const heroHeading = hasName && hasAddress
    ? `${trimmedName}, your profile is ready.`
    : hasName
      ? `${trimmedName}, add your address to complete your profile.`
      : hasAddress
        ? "Add your name to complete your profile."
        : "Complete your profile with your name and address.";

  const heroDescription = hasName && hasAddress
    ? "Manage your account details, keep delivery addresses updated, and jump straight into your latest orders from one clean space."
    : hasName
      ? "Your account is almost set. Add a delivery address so checkout feels fast and future orders go to the right place."
      : hasAddress
        ? "Your delivery details are saved. Add your name so your profile and future orders feel complete."
        : "Add your name and at least one delivery address so your account is ready for smooth checkout and order tracking.";

  const resetAddressFormState = () => {
    setDraft(null);
    setTouchedFields({});
    setSubmitAttempted(false);
  };

  const markAllAddressFieldsTouched = () => {
    setTouchedFields({
      addressLine: true,
      addressLine2: true,
      city: true,
      state: true,
      pincode: true,
      country: true,
    });
  };

  const handleAddressDraftChange = (value: AddressDraft) => {
    setDraft(value);
  };

  const handleAddressFieldBlur = (field: AddressField) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

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

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(user?.name || "");
    }
  }, [isEditingName, user?.name]);

  const handleSaveName = async () => {
    if (!normalizedNameDraft) {
      toast.error("Name is required");
      return;
    }

    const res = await updateProfile({ name: normalizedNameDraft });

    if (res?.success) {
      toast.success(res.message);
      setIsEditingName(false);
    } else {
      toast.error(res?.message || "Failed to update profile");
    }
  };

  const handleCancelNameEdit = () => {
    setNameDraft(user?.name || "");
    setIsEditingName(false);
  };

  const handleAddAddress = async () => {
    if (!draft) return;
    setSubmitAttempted(true);
    markAllAddressFieldsTouched();

    if (hasValidationErrors) {
      toast.error("Please fix the address form errors");
      return;
    }

    const normalizedDraft = sanitizeAddressDraft(draft);

    const res = await createAddress({
      addressLine1: normalizedDraft.addressLine,
      addressLine2: normalizedDraft.addressLine2 || null,
      city: normalizedDraft.city,
      state: normalizedDraft.state,
      postalCode: normalizedDraft.pincode,
      country: normalizedDraft.country || "India",
    });

    if (res?.success) {
      toast.success(res.message);
      setOpenAdd(false);
      resetAddressFormState();
    } else {
      toast.error(res?.message || "Failed to add address");
    }
  };

  const handleEditAddress = async () => {
    if (!draft?.id) return;
    setSubmitAttempted(true);
    markAllAddressFieldsTouched();

    if (hasValidationErrors) {
      toast.error("Please fix the address form errors");
      return;
    }

    const normalizedDraft = sanitizeAddressDraft(draft);

    const res = await updateAddress({
      id: normalizedDraft.id,
      addressLine1: normalizedDraft.addressLine,
      addressLine2: normalizedDraft.addressLine2 || null,
      city: normalizedDraft.city,
      state: normalizedDraft.state,
      postalCode: normalizedDraft.pincode,
      country: normalizedDraft.country || "India",
    });

    if (res?.success) {
      toast.success(res.message);
      setOpenEdit(false);
      resetAddressFormState();
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

  const handleSetPrimaryAddress = async (id: number) => {
    const res = await setPrimaryAddress(id);

    if (res?.success) {
      toast.success(res.message);
    } else {
      toast.error(res?.message || "Failed to update primary address");
    }
  };

  const openCreateDialog = () => {
    resetAddressFormState();
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
                {heroHeading}
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                {heroDescription}
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
                  {isEditingName ? (
                    <div className="mt-2 space-y-3">
                      <Input
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        placeholder="Enter your name"
                        className="h-11 max-w-sm"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={handleSaveName}
                          disabled={!normalizedNameDraft || authLoading}
                        >
                          Save Name
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={handleCancelNameEdit}
                          disabled={authLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-primary">
                        {trimmedName || "Add your name"}
                      </h2>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          setNameDraft(user?.name || "");
                          setIsEditingName(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {trimmedName ? "Edit Name" : "Add Name"}
                      </Button>
                    </div>
                  )}
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
                {addresses.map((address) => (
                  <article
                    key={address.id}
                    className="group rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--secondary)/0.12)_100%)] p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div
                          className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                            address.isPrimary
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {address.isPrimary ? "Primary Address" : "Saved Address"}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">
                          {user?.name || "Account Address"}
                        </h3>
                      </div>
                      <div className="flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        {!address.isPrimary ? (
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => handleSetPrimaryAddress(address.id)}
                            aria-label="Make primary address"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : null}
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
                            setTouchedFields({});
                            setSubmitAttempted(false);
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

                    <div className="mt-5 space-y-2 text-sm text-foreground/85 [overflow-wrap:anywhere]">
                      <p className="break-words">{address.addressLine1}</p>
                      {address.addressLine2 && <p className="break-words">{address.addressLine2}</p>}
                      <p className="break-words">
                        {address.city}, {address.state} - {address.postalCode}
                      </p>
                      <p className="break-words text-muted-foreground">{address.country}</p>
                    </div>

                    <div className="mt-6 flex gap-3 md:hidden">
                      {!address.isPrimary ? (
                        <Button
                          variant="secondary"
                          className="flex-1 rounded-full"
                          onClick={() => handleSetPrimaryAddress(address.id)}
                        >
                          Make Primary
                        </Button>
                      ) : (
                        <div className="flex flex-1 items-center justify-center rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary">
                          Primary Address
                        </div>
                      )}
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
                          setTouchedFields({});
                          setSubmitAttempted(false);
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

                    {!address.isPrimary ? (
                      <div className="mt-6 hidden md:block">
                        <Button
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => handleSetPrimaryAddress(address.id)}
                        >
                          Make Primary
                        </Button>
                      </div>
                    ) : null}
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
          if (!value) resetAddressFormState();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>

          <AddressForm
            draft={draft}
            onChange={handleAddressDraftChange}
            errors={validationErrors}
            touchedFields={submitAttempted ? {
              addressLine: true,
              addressLine2: true,
              city: true,
              state: true,
              pincode: true,
              country: true,
            } : touchedFields}
            onFieldBlur={handleAddressFieldBlur}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAddress} disabled={!draft || hasValidationErrors}>
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={openEdit}
        onOpenChange={(value) => {
          setOpenEdit(value);
          if (!value) resetAddressFormState();
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>

          <AddressForm
            draft={draft}
            onChange={handleAddressDraftChange}
            errors={validationErrors}
            touchedFields={submitAttempted ? {
              addressLine: true,
              addressLine2: true,
              city: true,
              state: true,
              pincode: true,
              country: true,
            } : touchedFields}
            onFieldBlur={handleAddressFieldBlur}
          />

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAddress} disabled={!draft || hasValidationErrors}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
