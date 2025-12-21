import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusBadge = (status: string) => {
  if (status === "delivered")
    return "bg-green-100 text-green-700";
  if (status === "processing")
    return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
};

export default function Orders() {
  const { orders, fetchOrders, loadMore, changeStatus, hasMore, loading } =
    useOrderStore();

  useEffect(() => {
    fetchOrders(true);
  }, []);

  const all = orders;
  const processing = orders.filter(o => o.status === "processing");
  const delivered = orders.filter(o => o.status === "delivered");

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-6 text-primary">
          <Package /> My Orders
        </h1>

        <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={(value) => changeStatus(value)}
        >
        <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
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
        </Tabs>

      </div>
    </div>
  );
}

function OrdersList({ list, loading, loadMore, hasMore }) {
  if (loading && !list.length)
    return <p className="text-center mt-10 text-muted-foreground">Loading orders...</p>;

  if (!list.length)
    return <p className="text-center mt-10 text-muted-foreground">No orders found</p>;

  return (
    <>
    <div className="space-y-5 mt-5">
      {list.map(order => (
        <div
          key={order.id}
          className="p-6 bg-white rounded-2xl shadow border hover:shadow-md transition"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-semibold text-primary">
                Order ID: {order.id}
              </h3>

              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toDateString()}
              </p>
            </div>

            <span className={`text-sm px-3 py-1 rounded-full capitalize ${statusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>

          <div className="mt-4">
          {order.items?.map((i, idx) => (
            <div
              key={idx}
              className="text-sm border-b pb-2 flex justify-between items-center"
            >
              <span>
                {i.name} × {i.quantity}
              </span>

              <span className="font-semibold">
                ₹{i.price}
              </span>
            </div>
          ))}

          <div className="mt-4 text-right space-y-1">
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
            <p className="text-lg font-bold">
              Paid: ₹{order.discountedPrice}
            </p>
          </div>

          </div>
        </div>
      ))}
    </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            className="px-6 py-2 bg-primary text-white rounded-lg"
            onClick={loadMore}
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}