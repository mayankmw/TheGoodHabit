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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, MapPin } from "lucide-react";
import {
  formatPaymentMethod,
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/payment";

type ShippingAddressLike = {
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
};

const formatShippingAddress = (order: ShippingAddressLike | null | undefined) =>
  [
    order?.shippingAddressLine1,
    order?.shippingAddressLine2,
    order?.shippingCity && order?.shippingState
      ? `${order.shippingCity}, ${order.shippingState} - ${order.shippingPostalCode || ""}`
      : null,
    order?.shippingCountry,
  ]
    .filter(Boolean)
    .join(", ");

const ORDER_STATUSES = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function AdminOrders() {
    const SHIPPING_PARTNERS = [
  {
    label: "Delhivery",
    value: "delhivery",
    trackUrl: "https://www.delhivery.com/track/package/",
  },
  {
    label: "Blue Dart",
    value: "bluedart",
    trackUrl: "https://www.bluedart.com/tracking?awb=",
  },
  {
    label: "DTDC",
    value: "dtdc",
    trackUrl:
      "https://www.dtdc.com/tracking/tracking_results.asp?Ttype=awb&strCnno=",
  },
  {
    label: "Ecom Express",
    value: "ecom",
    trackUrl: "https://ecomexpress.in/tracking/?awb=",
  },
  {
    label: "India Post",
    value: "indiapost",
    trackUrl:
      "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?trackid=",
  },
  {
    label: "Shadowfax",
    value: "shadowfax",
    trackUrl: "https://tracking.shadowfax.in/track/",
  },
  {
    label: "XpressBees",
    value: "xpressbees",
    trackUrl:
      "https://www.xpressbees.com/track-shipment.aspx?shipmentid=",
  },
];

  const {
    orders,
    selectedOrder,
    loadingOrdersList,
    loadingOrder,
    fetchOrders,
    fetchOrderById,
    updateOrder,
    clearSelectedOrder,
  } = useAdminStore();

  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [form, setForm] = useState<any>({
    status: "",
    shippingPartner: "",
    trackingNumber: "",
    trackingUrl: "",
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async () => {
    const res = await updateOrder({
      id: selectedOrder.id,
      ...form,
    });

    if (res?.success) {
      toast.success("Order updated");
      setOpenEdit(false);
    } else {
      toast.error(res?.message || "Failed to update order");
    }
  };

  if (loadingOrdersList) {
    return (
      <p className="text-center mt-10 text-gray-400">
        Loading orders...
      </p>
    );
  }

  if (!orders.length) {
    return (
      <p className="text-center mt-10 text-gray-400">
        No orders found
      </p>
    );
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <h1 className="text-3xl font-bold">Orders</h1>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Order Code</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Discounted</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {o.orderCode || `#${o.id}`}
                </td>

                <td className="px-4 py-3">
                  <div className="font-medium">{o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.email}</div>
                </td>

                <td className="px-4 py-3">₹{o.totalPrice}</td>

                <td className="px-4 py-3 text-green-600">
                  ₹{o.discountedPrice}
                </td>

                <td className="px-4 py-3 capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium
                      ${
                        o.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : o.status === "shipped"
                          ? "bg-blue-100 text-blue-700"
                          : o.status === "processing"
                          ? "bg-amber-100 text-amber-700"
                          : o.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    {o.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-gray-500">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 space-x-2">
                  <Button
                    variant="link"
                    onClick={async () => {
                      await fetchOrderById(o.id);
                      setOpenView(true);
                    }}
                  >
                    View
                  </Button>

                  <Button
                    variant="link"
                    onClick={async () => {
                      await fetchOrderById(o.id);
                      setForm({
                        status: o.status,
                        shippingPartner: o.shippingPartner || "",
                        trackingNumber: o.trackingNumber || "",
                        trackingUrl: o.trackingUrl || "",
                      });
                      setOpenEdit(true);
                    }}
                  >
                    Update
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= VIEW ORDER ================= */}
      <Dialog
        open={openView}
        onOpenChange={(v) => {
          setOpenView(v);
          if (!v) clearSelectedOrder();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {loadingOrder || !selectedOrder ? (
            <p className="text-center text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Order Code</span>
                <span className="font-medium">
                  {selectedOrder.orderCode || `#${selectedOrder.id}`}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Status</span>
                <span className="capitalize font-medium">
                  {selectedOrder.status}
                </span>
              </div>

              {selectedOrder.shippingAddressLine1 && (
                <div className="rounded-lg border bg-amber-50/60 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-semibold text-gray-700">
                    <MapPin className="h-4 w-4 text-primary" /> Delivery Address
                  </p>
                  <p className="mt-1 text-gray-600">
                    {formatShippingAddress(selectedOrder)}
                  </p>
                </div>
              )}

              <div className="rounded-lg border bg-amber-50/60 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <CreditCard className="h-4 w-4 text-primary" /> Payment
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-gray-600">
                    {formatPaymentMethod(selectedOrder.paymentMethod, selectedOrder.paymentDetails)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${paymentStatusBadgeClass(
                      selectedOrder.paymentStatus
                    )}`}
                  >
                    {paymentStatusLabel(selectedOrder.paymentStatus)}
                  </span>
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-gray-500">
                  {selectedOrder.paymentAmount != null && (
                    <p>
                      Amount: ₹{(selectedOrder.paymentAmount / 100).toFixed(2)}{" "}
                      {selectedOrder.paymentCurrency || "INR"}
                    </p>
                  )}
                  {selectedOrder.paymentDetails?.fee != null && (
                    <p>
                      Razorpay fee: ₹{Number(selectedOrder.paymentDetails.fee).toFixed(2)}
                      {selectedOrder.paymentDetails?.tax != null &&
                        ` (incl. ₹${Number(selectedOrder.paymentDetails.tax).toFixed(2)} tax)`}
                    </p>
                  )}
                  {selectedOrder.paymentEmail && <p>Payer email: {selectedOrder.paymentEmail}</p>}
                  {selectedOrder.paymentContact && <p>Payer contact: {selectedOrder.paymentContact}</p>}
                  {selectedOrder.razorpayPaymentId && (
                    <p>Payment ID: {selectedOrder.razorpayPaymentId}</p>
                  )}
                  {selectedOrder.razorpayOrderId && (
                    <p>Razorpay Order ID: {selectedOrder.razorpayOrderId}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <Label>Items</Label>
                <div className="space-y-2 mt-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-semibold pt-2">
                <span>Total</span>
                <span>₹{selectedOrder.discountedPrice}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenView(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= UPDATE ORDER ================= */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedOrder?.shippingAddressLine1 && (
              <div className="rounded-lg border bg-amber-50/60 p-3 text-sm">
                <p className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <MapPin className="h-4 w-4 text-primary" /> Ship To
                </p>
                <p className="mt-1 text-gray-600">
                  {formatShippingAddress(selectedOrder)}
                </p>
              </div>
            )}

            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm({ ...form, status: value })
              }
            >
              <SelectTrigger className="bg-white border border-input">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label>Shipping Partner</Label>
            <Select
            value={form.shippingPartner}
            onValueChange={(value) => {
                const partner = SHIPPING_PARTNERS.find(
                (p) => p.value === value
                );

                setForm({
                ...form,
                shippingPartner: value,
                trackingUrl: partner ? partner.trackUrl : "",
                });
            }}
            >
            <SelectTrigger className="bg-white border border-input">
                <SelectValue placeholder="Select shipping partner" />
            </SelectTrigger>

            <SelectContent className="bg-white border shadow-lg z-50">
                {SHIPPING_PARTNERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                    {p.label}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>


            <Label>Tracking Number</Label>
            <Input
            value={form.trackingNumber}
            onChange={(e) => {
                const trackingNumber = e.target.value;

                const partner = SHIPPING_PARTNERS.find(
                (p) => p.value === form.shippingPartner
                );

                setForm({
                ...form,
                trackingNumber,
                trackingUrl: partner
                    ? `${partner.trackUrl}${trackingNumber}`
                    : form.trackingUrl,
                });
            }}
            placeholder="Enter AWB / Tracking Number"
            />

            <Label>Tracking URL</Label>
            <Input
            value={form.trackingUrl}
            readOnly
            className="bg-gray-50 text-gray-600"
            placeholder="Auto generated"
            />

          </div>

          <DialogFooter>
            <Button onClick={handleUpdateOrder} className="bg-primary text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
