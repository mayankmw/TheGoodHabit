import { useEffect, useState } from "react";
import { MapPin, Plus, Package } from "lucide-react";
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
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";

export const Profile = () => {
  // ------------------------------
  // Zustand data
  // ------------------------------
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  // ------------------------------
  // Local UI state
  // ------------------------------
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openOrder, setOpenOrder] = useState(false);

  const [editAddress, setEditAddress] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  // ------------------------------
  // Fetch user data (real data)
  // ------------------------------
  useEffect(() => {
    const load = async () => {
      const data = await fetchMe(); // returns { user, addresses, orders }

      if (data) {
        setAddresses(data.addresses || []);
        setOrders(data.orders || []);
      }
    };

    load();
  }, []);

  // ------------------------------
  // Handlers
  // ------------------------------
  const handleAddAddress = () => {
    const newAddress = {
      id: Date.now(),
      ...editAddress,
      isSelected: true,
    };

    setAddresses([...addresses, newAddress]);
    setOpenAdd(false);
  };

  const handleEditAddress = () => {
    setAddresses((prev) =>
      prev.map((a) => (a.id === editAddress.id ? editAddress : a))
    );
    setOpenEdit(false);
  };

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <div className="min-h-screen bg-muted/10 py-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Top Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">
            Hello {user?.name || "User"}
          </h1>

          <Button
            variant="destructive"
            onClick={() => {
              logout();
              navigate("/signin");
            }}
          >
            Logout
          </Button>
        </div>

        {/* ---------------------------------------- */}
        {/* ADDRESS SECTION (OLD DESIGN) */}
        {/* ---------------------------------------- */}
        <section className="mb-14">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin /> Saved Addresses
            </h2>

            <Button
              className="flex items-center gap-2 bg-primary text-white"
              onClick={() => {
                setEditAddress({
                  name: user?.name || "",
                  phone: "",
                  pincode: "",
                  city: "",
                  state: "",
                  addressLine: "",
                });
                setOpenAdd(true);
              }}
            >
              <Plus size={18} /> Add New Address
            </Button>
          </div>

          {/* Address Cards (Old UI) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-5 bg-white rounded-2xl shadow border hover:shadow-md transition"
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold">{user?.name}</h3>
                  {a.isSelected && (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-sm mt-2">
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                  , {a.city}, {a.state} - {a.postalCode}
                </p>

                <p className="text-sm text-muted-foreground mt-1">{a.country}</p>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      setEditAddress({
                        id: a.id,
                        name: user?.name,
                        phone: "",
                        addressLine: `${a.addressLine1} ${a.addressLine2 || ""}`,
                        pincode: a.postalCode,
                        city: a.city,
                        state: a.state,
                      });
                      setOpenEdit(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="text-sm"
                    onClick={() =>
                      setAddresses(addresses.filter((x) => x.id !== a.id))
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------- */}
        {/* ORDERS SECTION (OLD DESIGN) */}
        {/* ---------------------------------------- */}
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Package /> My Orders
          </h2>

          <div className="space-y-5">
            {orders.map((order) => (
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

                  <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {order.status}
                  </span>
                </div>

                {/* items */}
                <div className="mt-4">
                  {order.items?.map((i, idx) => (
                    <p key={idx} className="text-sm border-b pb-2">
                      {i.name} × {i.quantity}
                    </p>
                  ))}

                  <p className="text-right font-semibold mt-3">
                    Total: ₹{order.totalPrice}
                  </p>
                </div>

                <Button
                  className="mt-4 w-full bg-primary text-white"
                  onClick={() => {
                    setSelectedOrder(order);
                    setOpenOrder(true);
                  }}
                >
                  View Details
                </Button>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* ------------------------------ */}
      {/* ADD ADDRESS MODAL (unchanged UI) */}
      {/* ------------------------------ */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <Label>Address Line</Label>
            <Input
              value={editAddress?.addressLine || ""}
              onChange={(e) =>
                setEditAddress({ ...editAddress, addressLine: e.target.value })
              }
            />

            <Label>Pincode</Label>
            <Input
              value={editAddress?.pincode || ""}
              onChange={(e) =>
                setEditAddress({ ...editAddress, pincode: e.target.value })
              }
            />

            <Label>City</Label>
            <Input
              value={editAddress?.city || ""}
              onChange={(e) =>
                setEditAddress({ ...editAddress, city: e.target.value })
              }
            />

            <Label>State</Label>
            <Input
              value={editAddress?.state || ""}
              onChange={(e) =>
                setEditAddress({ ...editAddress, state: e.target.value })
              }
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              className="bg-primary text-white"
              onClick={handleAddAddress}
            >
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

           {/* ------------------------------ */}
      {/* EDIT ADDRESS MODAL */}
      {/* ------------------------------ */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>

          {editAddress && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={editAddress.name}
                  onChange={(e) =>
                    setEditAddress({ ...editAddress, name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={editAddress.phone}
                  onChange={(e) =>
                    setEditAddress({ ...editAddress, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Address Line</Label>
                <Input
                  value={editAddress.addressLine}
                  onChange={(e) =>
                    setEditAddress({
                      ...editAddress,
                      addressLine: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleEditAddress} className="bg-primary text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------ */}
      {/* ORDER DETAILS MODAL */}
      {/* ------------------------------ */}
      <Dialog open={openOrder} onOpenChange={setOpenOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div>
              <p className="font-semibold text-primary">
                Order ID: {selectedOrder.id}
              </p>

              <p className="text-sm mt-1">{selectedOrder.date}</p>

              <div className="mt-4 space-y-2">
                {selectedOrder.items.map((i, idx) => (
                  <p key={idx} className="text-sm">
                    {i.name} × {i.qty}
                  </p>
                ))}
              </div>

              <p className="text-right font-semibold mt-4 text-lg">
                Total: ₹{selectedOrder.total}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
