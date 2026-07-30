import { useEffect, useState } from "react";
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

import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "react-country-state-city";

import { useAddressStore, type Address } from "@/store/useAddressStore";

export type AddressDraft = {
  id?: number;
  addressLine: string;
  addressLine2: string;

  country: string;
  countryId?: number;

  state: string;
  stateId?: number;

  city: string;
  cityId?: number;

  pincode: string;
};

export type AddressField = keyof AddressDraft;

export type AddressErrors = Partial<Record<Exclude<AddressField, "id" | "addressLine2">, string>>;

export const emptyAddressDraft = (): AddressDraft => ({
  addressLine: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

const addressToDraft = (address: Address): AddressDraft => ({
  id: address.id,
  addressLine: address.addressLine1,
  addressLine2: address.addressLine2 || "",
  city: address.city,
  state: address.state,
  pincode: address.postalCode,
  country: address.country || "India",
});

const PINCODE_REGEX = /^\d{6}$/;

export const sanitizeAddressDraft = (draft: AddressDraft): AddressDraft => ({
  ...draft,
  addressLine: draft.addressLine.trim(),
  addressLine2: draft.addressLine2.trim(),
  city: draft.city.trim(),
  state: draft.state.trim(),
  pincode: draft.pincode.replace(/\D/g, "").slice(0, 6),
  country: draft.country.trim(),
});

export const validateAddressDraft = (draft: AddressDraft | null): AddressErrors => {
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

export function AddressForm({
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
        <Label>Country</Label>

        <CountrySelect
          placeHolder="Select Country"
          value={draft.countryId}
          onChange={(country) => {
            onChange({
              ...draft,
              country: country.name,
              countryId: country.id,

              state: "",
              stateId: undefined,
              city: "",
              cityId: undefined,
            });

            onFieldBlur("country");
          }}
        />

        {showFieldError("country") && (
          <p className="text-sm text-destructive">
            {errors.country}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>State</Label>

        <StateSelect
          countryid={draft.countryId}
          placeHolder="Select State"
          value={draft.stateId}
          onChange={(state) => {
            onChange({
              ...draft,
              state: state.name,
              stateId: state.id,

              city: "",
              cityId: undefined,
            });

            onFieldBlur("state");
          }}
        />

        {showFieldError("state") && (
          <p className="text-sm text-destructive">
            {errors.state}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>City</Label>

        <CitySelect
          countryid={draft.countryId}
          stateid={draft.stateId}
          placeHolder="Select City"
          value={draft.cityId}
          onChange={(city) => {
            onChange({
              ...draft,
              city: city.name,
              cityId: city.id,
            });

            onFieldBlur("city");
          }}
        />

        {showFieldError("city") && (
          <p className="text-sm text-destructive">
            {errors.city}
          </p>
        )}
      </div>
    </div>
  );
}

const allFieldsTouched: Partial<Record<AddressField, boolean>> = {
  addressLine: true,
  addressLine2: true,
  city: true,
  state: true,
  pincode: true,
  country: true,
};

type AddressDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // "edit" requires initialAddress; "add" always starts from a blank draft.
  mode: "add" | "edit";
  initialAddress?: Address | null;
  // Called after a successful save (dialog is already closed by then).
  onSaved?: () => void;
};

// The single, global "add/edit address" modal — same form + validation used
// on the Profile page and from the cart's delivery-address picker.
export function AddressDialog({
  open,
  onOpenChange,
  mode,
  initialAddress,
  onSaved,
}: AddressDialogProps) {
  const createAddress = useAddressStore((s) => s.createAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);

  const [draft, setDraft] = useState<AddressDraft | null>(null);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<AddressField, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraft(mode === "edit" && initialAddress ? addressToDraft(initialAddress) : emptyAddressDraft());
    setTouchedFields({});
    setSubmitAttempted(false);
  }, [open, mode, initialAddress]);

  const errors = validateAddressDraft(draft);
  const hasErrors = Object.keys(errors).length > 0;

  const handleFieldBlur = (field: AddressField) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async () => {
    if (!draft) return;
    setSubmitAttempted(true);

    if (hasErrors) {
      toast.error("Please fix the address form errors");
      return;
    }

    const normalized = sanitizeAddressDraft(draft);
    const payload = {
      addressLine1: normalized.addressLine,
      addressLine2: normalized.addressLine2 || null,
      city: normalized.city,
      state: normalized.state,
      postalCode: normalized.pincode,
      country: normalized.country || "India",
    };

    setSaving(true);
    const res =
      mode === "edit" && normalized.id
        ? await updateAddress({ id: normalized.id, ...payload })
        : await createAddress(payload);
    setSaving(false);

    if (res?.success) {
      toast.success(res.message);
      onOpenChange(false);
      onSaved?.();
    } else {
      toast.error(res?.message || `Failed to ${mode === "edit" ? "update" : "add"} address`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>

        <AddressForm
          draft={draft}
          onChange={setDraft}
          errors={errors}
          touchedFields={submitAttempted ? allFieldsTouched : touchedFields}
          onFieldBlur={handleFieldBlur}
        />

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!draft || hasErrors || saving}>
            {mode === "edit" ? "Save Changes" : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
