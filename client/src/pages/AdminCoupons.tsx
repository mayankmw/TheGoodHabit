import { useEffect, useState } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DISCOUNT_TYPES = [
  { label: "Flat Discount (₹)", value: "flat" },
  { label: "Percentage (%)", value: "percent" },
  { label: "Free Gift", value: "free_gift" },
];

export default function AdminCoupons() {
  const {
    coupons,
    loadingCoupons,
    fetchCoupons,
    fetchCouponById,
    createCoupon,
    updateCoupon,
    toggleCoupon,
    selectedCoupon,
    clearSelectedCoupon,
  } = useAdminStore();

  const {
    products,
    loadingProducts,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    selectedProduct,
  } = useAdminStore();

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  const [form, setForm] = useState<any>({
    code: "",
    title: "",
    description: "",
    discount_type: "",
    gift_product_id: "",
    value: "",
    max_discount: "",
    min_order: "",
    starts_at: "",
    expires_at: "",
    auto_award: false,
    single_use_per_user: false,
    active: true,
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  /* ================= HANDLERS ================= */

  const resetForm = () =>
    setForm({
      code: "",
      title: "",
      description: "",
      discount_type: "",
      value: "",
      max_discount: "",
      min_order: "",
      starts_at: "",
      expires_at: "",
      auto_award: false,
      single_use_per_user: false,
      active: true,
    });

  const handleToggleCoupon = async (
    couponId: number,
    nextState: boolean
  ) => {
    const res = await toggleCoupon(couponId, nextState ? 1 : 0);

    if (res?.success) {
      toast.success(res?.message);
    } else {
      toast.error(res?.message || "Failed to update coupon status");
    }
  };

  const handleAddCoupon = async () => {
    const error = validateCoupon(form);
    if (error) {
      toast.error(error);
      return;
    }

    const res = await createCoupon(form);
    if (res?.success) {
      toast.success(res.message);
      setOpenAdd(false);
      resetForm();
    } else {
      toast.error(res?.message || "Failed to create coupon");
    }
  };

  const handleEditCoupon = async () => {
    const error = validateCoupon(form);
    if (error) {
      toast.error(error);
      return;
    }

    const res = await updateCoupon({
      id: selectedCoupon.id,
      ...form,
    });

    if (res?.success) {
      toast.success(res.message);
      setOpenEdit(false);
      clearSelectedCoupon();
    } else {
      toast.error(res?.message || "Failed to update coupon");
    }
  };


  if (loadingCoupons) {
    return <p className="text-center mt-10 text-gray-400">Loading coupons...</p>;
  }

  if (!coupons.length) {
    return <p className="text-center mt-10 text-gray-400">No coupons found</p>;
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Coupons</h1>

        <Button
          className="bg-primary text-white"
          onClick={() => {
            resetForm();
            setOpenAdd(true);
          }}
        >
          + Add Coupon
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Discount</th>
              <th className="px-4 py-3 text-left">Min Order</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-semibold">
                  <button
                    className="hover:underline"
                    onClick={async () => {
                      await fetchCouponById(c.id);
                      setOpenView(true);
                    }}
                  >
                    {c.code}
                  </button>
                </td>

                <td className="px-4 py-3">
                  <button
                    className="hover:underline"
                    onClick={async () => {
                      await fetchCouponById(c.id);
                      setOpenView(true);
                    }}
                  >
                    {c.title}
                  </button>
                </td>

                <td className="px-4 py-3">
                  {c.discount_type === "percent"
                    ? `${c.value}%`
                    : c.discount_type === "flat"
                      ? `₹${c.value}`
                      : "Free Gift"}
                </td>

                <td className="px-4 py-3">₹{c.min_order}</td>

                <td className="px-4 py-3">
                  <Switch
                    checked={Boolean(c.active)}
                    onCheckedChange={(v) =>
                      handleToggleCoupon(c.id, v)
                    }
                  />
                </td>

                <td className="px-4 py-3 space-x-2">
                  <Button
                    variant="link"
                    onClick={async () => {
                      await fetchCouponById(c.id);
                      setForm({
                        ...c,
                        auto_award: Boolean(c.auto_award),
                        single_use_per_user: Boolean(
                          c.single_use_per_user
                        ),
                        active: Boolean(c.active),
                      });
                      setOpenEdit(true);
                    }}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= ADD / EDIT / VIEW DIALOGS ================= */}
      {CouponDialog({
        open: openAdd,
        setOpen: setOpenAdd,
        title: "Add Coupon",
        form,
        setForm,
        onSubmit: handleAddCoupon,
      })}

      {CouponDialog({
        open: openEdit,
        setOpen: setOpenEdit,
        title: "Edit Coupon",
        form,
        setForm,
        onSubmit: handleEditCoupon,
      })}

      {ViewCouponDialog(openView, setOpenView, selectedCoupon)}
    </div>
  );
}

/* ================= SHARED DIALOG ================= */

function CouponDialog({
  open,
  setOpen,
  title,
  form,
  setForm,
  onSubmit,
}: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div className="space-y-4">
            {/* CODE + TITLE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                />
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* DISCOUNT TYPE */}
            <div>
              <Label>Discount Type</Label>
              <Select
                value={form.discount_type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    discount_type: v,
                    value: "",
                    max_discount: "",
                    gift_product_id: "",
                  })
                }
              >
                <SelectTrigger className="bg-white border border-input">
                  <SelectValue placeholder="Select coupon type" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {DISCOUNT_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DISCOUNT + MIN ORDER */}
            {form.discount_type !== "free_gift" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    Discount Value {form.discount_type === "percent" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* MAX DISCOUNT (only for %) */}
            {form.discount_type === "percent" && (
              <div>
                <Label>Max Discount (₹)</Label>
                <Input
                  type="number"
                  value={form.max_discount}
                  onChange={(e) =>
                    setForm({ ...form, max_discount: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <Label>Minimum Order (₹)</Label>
              <Input
                type="number"
                value={form.min_order}
                onChange={(e) =>
                  setForm({ ...form, min_order: e.target.value })
                }
              />
            </div>

            {/* FREE GIFT PRODUCT */}
            {form.discount_type === "free_gift" && (
              <div>
                <Label>Gift Product</Label>
                <Select
                  value={form.gift_product_id}
                  onValueChange={(v) =>
                    setForm({ ...form, gift_product_id: v })
                  }
                >
                  <SelectTrigger className="bg-white border border-input">
                    <SelectValue placeholder="Select gift product" />
                  </SelectTrigger>

                  <SelectContent className="bg-white border shadow-lg z-50">
                    {useAdminStore.getState().products.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* DATES */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Starts At</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) =>
                    setForm({ ...form, starts_at: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Expires At</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) =>
                    setForm({ ...form, expires_at: e.target.value })
                  }
                />
              </div>
            </div>

            {/* SWITCHES */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <Label className="text-sm">Auto Apply</Label>
                <Switch
                  checked={form.auto_award}
                  onCheckedChange={(v) =>
                    setForm({ ...form, auto_award: v })
                  }
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg px-3 py-2">
                <Label className="text-sm">Single Use</Label>
                <Switch
                  checked={form.single_use_per_user}
                  onCheckedChange={(v) =>
                    setForm({ ...form, single_use_per_user: v })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button onClick={onSubmit} className="bg-primary text-white">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}

/* ================= VIEW DIALOG ================= */

function ViewCouponDialog(open: boolean, setOpen: any, coupon: any) {
  if (!coupon) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Coupon Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Detail label="Code" value={coupon.code} />
          <Detail label="Title" value={coupon.title} />
          <Detail label="Description" value={coupon.description || "-"} />

          <Detail label="Discount Type" value={coupon.discount_type} />

          <Detail
            label="Discount Value"
            value={
              coupon.discount_type === "percent"
                ? `${coupon.value}%`
                : coupon.discount_type === "flat"
                  ? `₹${coupon.value}`
                  : "Free Gift"
            }
          />

          {coupon.discount_type === "free_gift" && (
            <Detail
              label="Gift Product ID"
              value={coupon.gift_product_id}
            />
          )}

          <Detail
            label="Max Discount"
            value={coupon.max_discount ? `₹${coupon.max_discount}` : "-"}
          />

          <Detail label="Minimum Order" value={`₹${coupon.min_order}`} />

          <Detail
            label="Starts At"
            value={
              coupon.starts_at
                ? new Date(coupon.starts_at).toLocaleString()
                : "-"
            }
          />

          <Detail
            label="Expires At"
            value={
              coupon.expires_at
                ? new Date(coupon.expires_at).toLocaleString()
                : "-"
            }
          />

          <Detail label="Auto Award" value={coupon.auto_award ? "Yes" : "No"} />
          <Detail
            label="Single Use Per User"
            value={coupon.single_use_per_user ? "Yes" : "No"}
          />

          <Detail label="Status" value={coupon.active ? "Active" : "Inactive"} />

          <Detail
            label="Created At"
            value={new Date(coupon.createdAt).toLocaleString()}
          />

          <Detail
            label="Updated At"
            value={new Date(coupon.updatedAt).toLocaleString()}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b pb-1">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function validateCoupon(form: any) {
  if (!form.code || form.code.trim().length < 3) {
    return "Coupon code is required (min 3 characters)";
  }

  if (!form.title) {
    return "Coupon title is required";
  }

  if (!form.discount_type) {
    return "Please select a discount type";
  }

  if (form.min_order === "" || Number(form.min_order) < 0) {
    return "Minimum order must be 0 or greater";
  }

  if (form.starts_at && form.expires_at) {
    if (new Date(form.expires_at) <= new Date(form.starts_at)) {
      return "Expiry date must be after start date";
    }
  }

  /* ---------- FLAT ---------- */
  if (form.discount_type === "flat") {
    if (!form.value || Number(form.value) <= 0) {
      return "Flat discount value must be greater than 0";
    }
  }

  /* ---------- PERCENT ---------- */
  if (form.discount_type === "percent") {
    if (!form.value || Number(form.value) <= 0 || Number(form.value) > 100) {
      return "Percentage discount must be between 1 and 100";
    }

    if (!form.max_discount || Number(form.max_discount) <= 0) {
      return "Max discount is required for percentage coupons";
    }
  }

  /* ---------- FREE GIFT ---------- */
  if (form.discount_type === "free_gift") {
    if (!form.gift_product_id) {
      return "Please select a gift product";
    }
  }

  return null; // ✅ valid
}
