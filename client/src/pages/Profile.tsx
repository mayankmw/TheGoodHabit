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
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useAddressStore } from "@/store/useAddressStore";
import { useOrderStore } from "@/store/useOrderStore";

import { useNavigate } from "react-router-dom";

export const Profile = () => {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);

  const {
    addresses,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
  } = useAddressStore();

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editAddress, setEditAddress] = useState<any>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      await fetchMe();
      await fetchAddresses();
    };

    load();
  }, []);

const handleAddAddress = async () => {
  const res = await createAddress({
    addressLine1: editAddress.addressLine,
    addressLine2: editAddress.addressLine2 || null,
    city: editAddress.city,
    state: editAddress.state,
    postalCode: editAddress.pincode,
    country: editAddress.country || "India",
  });

  if (res?.success) {
    toast.success(res.message);
    setOpenAdd(false);
  } else {
    toast.error(res?.message);
  }
};


const handleEditAddress = async () => {
  const res = await updateAddress({
    id: editAddress.id,
    addressLine1: editAddress.addressLine,
    addressLine2: editAddress.addressLine2 || null,
    city: editAddress.city,
    state: editAddress.state,
    postalCode: editAddress.pincode,
    country: editAddress.country || "India",
  });

  if (res?.success) {
    toast.success(res.message);
    setOpenEdit(false);
  } else {
    toast.error(res?.message);
  }
};


const handleDelete = async (id: number) => {
  const res = await deleteAddress(id);

  if (res?.success) {
    toast.success(res.message);
  } else {
    toast.error(res?.message);
  }
};


  // ------------------------------
  // RENDER
  // ------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-16 px-4">
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
        {/* ADDRESS SECTION */}
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
                  addressLine: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  pincode: "",
                  country: "India",
                });
                setOpenAdd(true);
              }}
            >
              <Plus size={18} /> Add New Address
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="p-5 bg-white rounded-2xl shadow border hover:shadow-md transition"
              >
                <h3 className="font-semibold">{user?.name}</h3>

                <p className="text-sm mt-2">
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}, {a.city},{" "}
                  {a.state} - {a.postalCode}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  {a.country}
                </p>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="text-sm"
                    onClick={() => {
                      setEditAddress({
                        id: a.id,
                        addressLine: a.addressLine1,
                        addressLine2: a.addressLine2 || "",
                        city: a.city,
                        state: a.state,
                        pincode: a.postalCode,
                        country: a.country || "India",
                      });
                      setOpenEdit(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                    className="text-sm"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

<Button
  className="bg-primary text-white mt-3"
  onClick={() => navigate("/orders")}
>
  View My Orders
</Button>
      </div>

      {/* Add Address Modal */}
    <Dialog open={openAdd} onOpenChange={setOpenAdd}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">

          <Label>Address Line 1</Label>
          <Input
            value={editAddress?.addressLine}
            onChange={(e) =>
              setEditAddress({ ...editAddress, addressLine: e.target.value })
            }
          />

          <Label>Address Line 2 (Optional)</Label>
          <Input
            value={editAddress?.addressLine2}
            onChange={(e) =>
              setEditAddress({ ...editAddress, addressLine2: e.target.value })
            }
          />

          <Label>Pincode</Label>
          <Input
            value={editAddress?.pincode}
            onChange={(e) =>
              setEditAddress({ ...editAddress, pincode: e.target.value })
            }
          />

          <Label>City</Label>
          <Input
            value={editAddress?.city}
            onChange={(e) =>
              setEditAddress({ ...editAddress, city: e.target.value })
            }
          />

          <Label>State</Label>
          <Input
            value={editAddress?.state}
            onChange={(e) =>
              setEditAddress({ ...editAddress, state: e.target.value })
            }
          />

          <Label>Country</Label>
          <Input
            value={editAddress?.country}
            onChange={(e) =>
              setEditAddress({ ...editAddress, country: e.target.value })
            }
          />

        </div>

        <DialogFooter className="mt-4">
          <Button className="bg-primary text-white" onClick={handleAddAddress}>
            Add Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


      {/* Edit Address Modal */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>

          {editAddress && (
            <div className="space-y-3 mt-2">

              <Label>Address Line 1</Label>
              <Input
                value={editAddress.addressLine}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    addressLine: e.target.value,
                  })
                }
              />

              <Label>Address Line 2 (Optional)</Label>
              <Input
                value={editAddress.addressLine2}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    addressLine2: e.target.value,
                  })
                }
              />

              <Label>Pincode</Label>
              <Input
                value={editAddress.pincode}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    pincode: e.target.value,
                  })
                }
              />

              <Label>City</Label>
              <Input
                value={editAddress.city}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    city: e.target.value,
                  })
                }
              />

              <Label>State</Label>
              <Input
                value={editAddress.state}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    state: e.target.value,
                  })
                }
              />

              <Label>Country</Label>
              <Input
                value={editAddress.country}
                onChange={(e) =>
                  setEditAddress({
                    ...editAddress,
                    country: e.target.value,
                  })
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleEditAddress} className="bg-primary text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
