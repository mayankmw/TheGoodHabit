import { FormEvent, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";

type OrderItem = {
  productId?: number;
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
};

type TrackingStep = {
  key: string;
  label: string;
  state: "completed" | "active" | "pending";
  date: string | null;
};

type TrackingResponse = {
  orderCode: string;
  orderId: number;
  status: string;
  statusLabel: string;
  placedAt: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  shippingPartner?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  summary: {
    subtotal: number;
    paid: number;
    discount: number;
  };
  steps: TrackingStep[];
  items: OrderItem[];
};

const stepIcons: Record<string, JSX.Element> = {
  placed: <Package className="h-5 w-5" />,
  processing: <Loader2 className="h-5 w-5" />,
  shipped: <Truck className="h-5 w-5" />,
  delivered: <CheckCircle2 className="h-5 w-5" />,
};

const statusBadge = (status: string) => {
  if (status === "delivered") return "bg-green-100 text-green-700";
  if (status === "shipped") return "bg-blue-100 text-blue-700";
  if (status === "processing") return "bg-amber-100 text-amber-700";
  if (status === "pending") return "bg-slate-100 text-slate-700";
  if (status === "cancelled") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const normalizeOrderCode = (value: string) =>
  value.trim().replace(/^#/, "").toUpperCase();

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrackOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedQuery = normalizeOrderCode(orderId);

    if (!normalizedQuery) {
      toast.error("Please enter an order code");
      setTrackingData(null);
      setSearched(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const { data } = await api.post("/orders/track", {
        orderCode: normalizedQuery,
      });

      if (!data.success || !data.tracking) {
        setTrackingData(null);
        toast.error(data.message || "Order not found");
        return;
      }

      setTrackingData(data.tracking);
    } catch (error) {
      console.error("track order error", error);
      setTrackingData(null);
      toast.error("Failed to fetch tracking details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-4">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-extrabold text-primary mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your Order ID to check the latest status of your order.
        </p>
      </div>

      {/* 🔍 Tracking Input */}
      <form
        onSubmit={handleTrackOrder}
        className="max-w-lg mx-auto bg-white shadow-md rounded-2xl p-6 flex items-center gap-2 border"
      >
        <Input
          type="text"
          placeholder="Enter your Order Code (e.g. NB000123)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-1"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
          {loading ? "Tracking..." : "Track"}
        </Button>
      </form>

      {searched && !loading && !trackingData && (
        <div className="mt-8 max-w-3xl mx-auto rounded-2xl border border-dashed bg-white/80 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-primary">Order not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a valid order code to track the latest order status.
          </p>
        </div>
      )}

      {/* 🚚 Tracking Info */}
      {trackingData && (
        <div className="mt-12 max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg border">
          <div className="text-left mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Order Code:{" "}
              <span className="text-foreground">
                {trackingData.orderCode}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {formatDate(trackingData.placedAt)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${statusBadge(
                  trackingData.status
                )}`}
              >
                {trackingData.statusLabel}
              </span>
              {trackingData.trackingNumber && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  Tracking No: {trackingData.trackingNumber}
                </span>
              )}
              {trackingData.shippingPartner && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-700">
                  {trackingData.shippingPartner}
                </span>
              )}
            </div>
          </div>

          {trackingData.status === "cancelled" ? (
            <div className="mb-8 rounded-2xl border border-red-100 bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">This order has been cancelled</p>
                  <p className="text-sm text-red-600/80">
                    The order status is cancelled in the current system.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative mb-8 mt-8 flex justify-between gap-3">
              <div className="absolute left-0 right-0 top-5 h-[2px] bg-muted" />
              {trackingData.steps.map((step, index) => {
                const status = step.state;
                return (
                  <div
                    key={index}
                    className={`relative z-10 flex w-1/4 flex-col items-center text-center ${
                      status === "completed"
                        ? "text-green-600"
                        : status === "active"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all duration-300 ${
                        status === "completed"
                          ? "border-green-600 bg-green-100"
                          : status === "active"
                          ? "border-primary bg-primary/10"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      {stepIcons[step.key] || <Package className="h-5 w-5" />}
                    </div>
                    <p className="mt-2 text-xs font-medium">{step.label}</p>
                    {step.date && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(step.date)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 📦 Order Details */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
            <ul className="space-y-3">
              {trackingData.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-sm border-b pb-2"
                >
                  <span>
                    {item.name}{" "}
                    <span className="text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">
                Subtotal: ₹{trackingData.summary.subtotal}
              </p>
              {trackingData.summary.discount > 0 && (
                <p className="mt-1 text-sm font-medium text-green-600">
                  Discount: -₹{trackingData.summary.discount.toFixed(0)}
                </p>
              )}
              <p className="text-base font-bold text-primary mt-1">
                Paid: ₹{trackingData.summary.paid}
              </p>
              {trackingData.trackingUrl && (
                <a
                  href={trackingData.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-medium text-primary underline underline-offset-4"
                >
                  Open courier tracking
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
