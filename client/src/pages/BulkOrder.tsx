import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProductStore } from "@/store/useProductStore";
import { useBulkOrderStore } from "@/store/useBulkOrderStore";

const MIN_BULK_QUANTITY = 10;

type BulkOrderForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm = (): BulkOrderForm => ({
  name: "",
  email: "",
  phone: "",
  address: "",
});

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export const BulkOrder = () => {
  const { products, fetchProducts, loading } = useProductStore();
  const { submitBulkOrder, loading: submitting } = useBulkOrderStore();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<BulkOrderForm>(emptyForm());

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const selectedItems = useMemo(
    () =>
      products
        .map((product) => ({
          product,
          quantity: quantities[String(product.id)] || 0,
        }))
        .filter((entry) => entry.quantity >= MIN_BULK_QUANTITY),
    [products, quantities]
  );

  const hasPartialSelection = useMemo(
    () => Object.values(quantities).some((quantity) => quantity > 0 && quantity < MIN_BULK_QUANTITY),
    [quantities]
  );

  const isFormValid =
    form.name.trim().length > 0 &&
    isValidEmail(form.email.trim()) &&
    form.phone.trim().length > 0 &&
    form.address.trim().length > 0;

  const canSubmit = selectedItems.length > 0 && isFormValid && !hasPartialSelection && !submitting;

  const setProductQuantity = (productId: string | number, nextQuantity: number) => {
    const key = String(productId);
    const safeQuantity = Number.isFinite(nextQuantity) ? Math.max(0, Math.floor(nextQuantity)) : 0;

    setQuantities((prev) => {
      if (safeQuantity === 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [key]: safeQuantity,
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedItems.length === 0) {
      toast.error("Select at least one product with a quantity of 10 or more");
      return;
    }

    if (hasPartialSelection) {
      toast.error("Bulk order quantities must be at least 10 per selected product");
      return;
    }

    if (!isFormValid) {
      toast.error("Please complete all required details");
      return;
    }

    const response = await submitBulkOrder({
      ...form,
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      items: selectedItems.map(({ product, quantity }) => ({
        productId: Number(product.id),
        quantity,
      })),
    });

    if (response.success) {
      toast.success(response.message);
      setQuantities({});
      setForm(emptyForm());
      return;
    }

    toast.error(response.message || "Failed to submit bulk order");
  };

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#fff8eb_0%,#ffffff_45%,#fff4d8_100%)] py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Bulk Orders
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">
              Build your bulk order in one place.
            </h1>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Choose the products you want, set a quantity of at least 10 per item, and send us your inquiry. We will handle the rest directly with you.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              {loading ? (
                <div className="rounded-[28px] border bg-white p-10 text-center text-lg text-muted-foreground shadow-sm">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-[28px] border bg-white p-10 text-center text-lg text-muted-foreground shadow-sm">
                  No products available for bulk order right now.
                </div>
              ) : (
                products.map((product) => {
                  const quantity = quantities[String(product.id)] || 0;
                  const hasInlineError = quantity > 0 && quantity < MIN_BULK_QUANTITY;
                  const primaryImage =
                    product.image ||
                    (Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : null);

                  return (
                    <article
                      key={product.id}
                      className="rounded-[28px] border border-border bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex items-center gap-4 md:flex-1">
                          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-secondary/10">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ShoppingBag className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <h2 className="text-xl font-black uppercase tracking-wide text-foreground">
                              {product.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {product.category ? (
                                <span className="rounded-full bg-secondary/20 px-3 py-1 font-medium capitalize text-foreground">
                                  {product.category.replace(/_/g, " ")}
                                </span>
                              ) : null}
                              <span>Bulk minimum: {MIN_BULK_QUANTITY}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-foreground">
                                ₹{product.discountedPrice}
                              </span>
                              <span className="text-sm text-muted-foreground line-through">
                                ₹{product.originalPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="md:w-52">
                          <div className="flex items-center justify-between rounded-full border border-border bg-muted/40 p-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => setProductQuantity(product.id, quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>

                            <Input
                              type="number"
                              min={0}
                              value={quantity || ""}
                              onChange={(e) =>
                                setProductQuantity(product.id, Number(e.target.value || 0))
                              }
                              placeholder="0"
                              className="mx-2 h-10 border-0 bg-transparent text-center text-base font-semibold shadow-none focus-visible:ring-0"
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => setProductQuantity(product.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <p className="mt-2 text-xs text-muted-foreground">
                            Enter 10 or more to include this product.
                          </p>
                          {hasInlineError ? (
                            <p className="mt-2 text-xs font-medium text-destructive">
                              Minimum quantity for a bulk order is {MIN_BULK_QUANTITY}.
                            </p>
                          ) : quantity >= MIN_BULK_QUANTITY ? (
                            <p className="mt-2 text-xs font-medium text-green-700">
                              Included in your bulk inquiry.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-foreground">Selected Products</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Only products with quantity 10 or more will be submitted.
                </p>

                <div className="mt-5 space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      No products selected yet.
                    </div>
                  ) : (
                    selectedItems.map(({ product, quantity }) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between rounded-2xl bg-secondary/10 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">₹{product.discountedPrice} each</p>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-foreground shadow-sm">
                          Qty {quantity}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black text-foreground">Your Details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share your information and we will contact you about pricing, logistics, and next steps.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                    />
                    {form.email.length > 0 && !isValidEmail(form.email) ? (
                      <p className="mt-2 text-xs font-medium text-destructive">
                        Enter a valid email address.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Phone Number</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">Address</label>
                    <Textarea
                      value={form.address}
                      onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Complete delivery address"
                      className="min-h-28"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {submitting ? "Submitting..." : "Submit Bulk Order Inquiry"}
                  </Button>

                  {!canSubmit ? (
                    <p className="text-xs text-muted-foreground">
                      Select at least one product with quantity 10 or more and complete all contact details to continue.
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BulkOrder;
