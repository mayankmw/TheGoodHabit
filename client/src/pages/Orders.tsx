import { useEffect } from "react";
import { CreditCard, MapPin, Package } from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  formatPaymentMethod,
  paymentStatusBadgeClass,
  paymentStatusLabel,
} from "@/lib/payment";

const statusBadge = (status: string) => {
  if (status === "delivered")
    return "bg-green-100 text-green-700";
  if (status === "shipped")
    return "bg-blue-100 text-blue-700";
  if (status === "processing")
    return "bg-amber-100 text-amber-700";
  if (status === "cancelled")
    return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function Orders() {
  const { orders, fetchOrders, loadMore, changeStatus, hasMore, loading } =
    useOrderStore();

  useEffect(() => {
    fetchOrders(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 py-12 px-4 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-2xl border border-amber-100 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-primary">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Package className="h-5 w-5" />
            </span>
            My Orders
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track every order, payment, and delivery status in one place.
          </p>
        </div>

        <Tabs
          defaultValue="all"
          className="w-full"
          onValueChange={(value) => changeStatus(value)}
        >
        <TabsList className="h-auto w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-transparent p-0">
            <TabsTrigger className="rounded-xl border bg-white data-[state=active]:bg-primary data-[state=active]:text-white" value="all">All</TabsTrigger>
            <TabsTrigger className="rounded-xl border bg-white data-[state=active]:bg-primary data-[state=active]:text-white" value="processing">Processing</TabsTrigger>
            <TabsTrigger className="rounded-xl border bg-white data-[state=active]:bg-primary data-[state=active]:text-white" value="shipped">Shipped</TabsTrigger>
            <TabsTrigger className="rounded-xl border bg-white data-[state=active]:bg-primary data-[state=active]:text-white" value="delivered">Delivered</TabsTrigger>
            <TabsTrigger className="rounded-xl border bg-white data-[state=active]:bg-primary data-[state=active]:text-white" value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
            <OrdersList
            list={orders}
            loading={loading}
            loadMore={loadMore}
            hasMore={hasMore}
            />
        </TabsContent>

        <TabsContent value="processing">
            <OrdersList
            list={orders}
            loading={loading}
            loadMore={loadMore}
            hasMore={hasMore}
            />
        </TabsContent>

        <TabsContent value="delivered">
            <OrdersList
            list={orders}
            loading={loading}
            loadMore={loadMore}
            hasMore={hasMore}
            />
        </TabsContent>

        <TabsContent value="shipped">
            <OrdersList
            list={orders}
            loading={loading}
            loadMore={loadMore}
            hasMore={hasMore}
            />
        </TabsContent>

        <TabsContent value="cancelled">
            <OrdersList
            list={orders}
            loading={loading}
            loadMore={loadMore}
            hasMore={hasMore}
            />
        </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}

function OrdersList({ list, loading, loadMore, hasMore }) {
  if (loading && !list.length)
    return (
      <div className="mt-6 rounded-2xl border border-dashed bg-white/70 p-10 text-center text-muted-foreground">
        Loading orders...
      </div>
    );

  if (!list.length)
    return (
      <div className="mt-6 rounded-2xl border border-dashed bg-white/70 p-10 text-center">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );

  return (
    <>
    <div className="space-y-4 mt-6">
      {list.map(order => (
        <div
          key={order.id}
          className="rounded-2xl border border-amber-100/70 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Order ID
              </p>
              <h3 className="font-semibold text-primary">
                #{order.id}
              </h3>

              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <span className={`text-xs px-3 py-1.5 rounded-full capitalize font-medium ${statusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {order.shippingAddressLine1 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                    Delivered to
                  </p>
                  <p className="mt-0.5 text-foreground/85">
                    {[
                      order.shippingAddressLine1,
                      order.shippingAddressLine2,
                      `${order.shippingCity}, ${order.shippingState} - ${order.shippingPostalCode}`,
                      order.shippingCountry,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {order.shippingPhone && (
                    <p className="mt-1 text-foreground/85">📞 {order.shippingPhone}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-xs">
              <CreditCard className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                  Payment
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="text-foreground/85">
                    {formatPaymentMethod(order.paymentMethod, order.paymentDetails)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${paymentStatusBadgeClass(
                      order.paymentStatus
                    )}`}
                  >
                    {paymentStatusLabel(order.paymentStatus)}
                  </span>
                </div>
                {order.razorpayPaymentId && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Payment ID: {order.razorpayPaymentId}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border bg-slate-50/60 p-3">
          {order.items?.map((i, idx) => (
            <div
              key={idx}
              className="text-sm border-b last:border-b-0 py-2 flex justify-between items-center gap-3"
            >
              <span className="text-foreground/90">
                {i.name} × {i.quantity}
              </span>

              <span className="font-semibold whitespace-nowrap">
                ₹{i.price}
              </span>
            </div>
          ))}
          </div>

          <div className="mt-4 flex flex-col items-end space-y-1">
            {/* Subtotal */}
            <p className="text-sm text-muted-foreground">
              Subtotal: <span className="font-semibold text-foreground">₹{order.totalPrice}</span>
            </p>

            {/* Discount (only if applied) */}
            {order.discountedPrice < order.totalPrice && (
              <p className="text-sm text-green-600 font-medium">
                Discount: −₹{(order.totalPrice - order.discountedPrice).toFixed(0)}
              </p>
            )}

            {/* Final Amount */}
            <p className="text-lg font-bold text-primary">
              Paid: ₹{order.discountedPrice}
            </p>
          </div>

        </div>
      ))}
    </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button
            className="rounded-full px-8"
            onClick={loadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </>
  );
}
