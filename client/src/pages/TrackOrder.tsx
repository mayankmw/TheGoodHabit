import { useState } from "react";
import { Package, Truck, CheckCircle2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  { label: "Order Placed", icon: <Package className="h-5 w-5" /> },
  { label: "Packed", icon: <Loader2 className="h-5 w-5" /> },
  { label: "Shipped", icon: <Truck className="h-5 w-5" /> },
  { label: "Delivered", icon: <CheckCircle2 className="h-5 w-5" /> },
];

export const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [trackingData, setTrackingData] = useState(null);

  const handleTrackOrder = (e) => {
    e.preventDefault();

    // mock order data — you can replace this with API integration later
    const mockData = {
      id: orderId || "GH123456",
      status: "Shipped",
      datePlaced: "25 Oct 2025",
      estimatedDelivery: "30 Oct 2025",
      items: [
        { name: "Chocolate Protein Bar", qty: 2, price: 249 },
        { name: "Almond Dates Combo", qty: 1, price: 499 },
      ],
    };

    setTrackingData(mockData);
  };

  const getStepStatus = (currentStatus, step) => {
    const statusOrder = ["Order Placed", "Packed", "Shipped", "Delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(step);
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
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
          placeholder="Enter your Order ID (e.g. GH123456)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-1"
        >
          <Search size={16} /> Track
        </Button>
      </form>

      {/* 🚚 Tracking Info */}
      {trackingData && (
        <div className="mt-12 max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-lg border">
          <div className="text-left mb-6">
            <h2 className="text-lg font-semibold text-primary">
              Order ID: <span className="text-foreground">{trackingData.id}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Placed on {trackingData.datePlaced} | Estimated Delivery:{" "}
              <strong>{trackingData.estimatedDelivery}</strong>
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="relative flex justify-between items-center mt-8 mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-muted -z-10"></div>
            {steps.map((step, index) => {
              const status = getStepStatus(trackingData.status, step.label);
              return (
                <div
                  key={index}
                  className={`flex flex-col items-center w-1/4 ${
                    status === "completed"
                      ? "text-green-600"
                      : status === "active"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      status === "completed"
                        ? "bg-green-100 border-green-600"
                        : status === "active"
                        ? "bg-primary/10 border-primary"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <p className="text-xs mt-2 font-medium">{step.label}</p>
                </div>
              );
            })}
          </div>

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
                    {item.name} <span className="text-muted-foreground">× {item.qty}</span>
                  </span>
                  <span className="font-semibold">₹{item.price * item.qty}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">
                Subtotal: ₹
                {trackingData.items.reduce(
                  (sum, item) => sum + item.price * item.qty,
                  0
                )}
              </p>
              <p className="text-base font-bold text-primary mt-1">
                Total: ₹
                {trackingData.items.reduce(
                  (sum, item) => sum + item.price * item.qty,
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
