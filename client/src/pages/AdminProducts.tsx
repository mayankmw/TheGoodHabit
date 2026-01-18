import { useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { useState } from "react";
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


export default function AdminProducts() {
  const PRODUCT_CATEGORIES = [
  { label: "Dates", value: "dates" },
  { label: "Snacks", value: "snacks" },
  { label: "Protein Bar", value: "protein_bar" },
  { label: "Breakfast", value: "breakfast" },
];

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
  name: "",
  category: "",
  originalPrice: "",
  discountedPrice: "",
  description: "",
  ingredients: "",
  image: null,
});

const handleAddProduct = async () => {
  const res = await createProduct({
    ...form,
    ingredients: form.ingredients
      ? form.ingredients.split(",").map((i: string) => i.trim())
      : [],
  });

  if (res?.success) {
    toast.success(res?.message);
    setOpenAdd(false);
    setForm({
      name: "",
      category: "",
      originalPrice: "",
      discountedPrice: "",
      description: "",
      ingredients: "",
      image: null,
    });
  } else {
    toast.error(res?.message || "Failed to add product");
  }
};

const handleEditProduct = async () => {
  const res = await updateProduct({
    id: selectedProduct.id,
    ...form,
    ingredients: form.ingredients
      ? form.ingredients.split(",").map((i: string) => i.trim())
      : [],
  });

  if (res?.success) {
    toast.success(res?.message);
    setOpenEdit(false);
  } else {
    toast.error(res?.message || "Failed to update product");
  }
};

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loadingProducts) {
    return <p className="text-center mt-10 text-gray-400">Loading products...</p>;
  }

  if (!products.length) {
    return <p className="text-center mt-10 text-gray-400">No products found</p>;
  }

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>

        <Button
          className="bg-primary text-white"
          onClick={() => {
            setForm({
              name: "",
              category: "",
              originalPrice: "",
              discountedPrice: "",
              description: "",
              ingredients: "",
              image: null,
            });
            setOpenAdd(true);
          }}
        >
          + Add Product
        </Button>

      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">category</th>
              <th className="px-4 py-3 text-left">Price(INR)</th>
              <th className="px-4 py-3 text-left">Discounted(INR)</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                      N/A
                    </div>
                  )}
                </td>

                <td className="px-4 py-3 font-medium">
                  <button
                    className="text-left hover:underline"
                    onClick={async () => {
                      await fetchProductById(p.id);
                      setOpenView(true);
                    }}
                  >
                    {p.name}
                  </button>
                </td>

                <td className="px-4 py-3 capitalize text-gray-600">
                  {p.category || "-"}
                </td>
                <td className="px-4 py-3">₹{p.originalPrice}</td>
                <td className="px-4 py-3 text-green-600">
                  ₹{p.discountedPrice}
                </td>

                <td className="px-4 py-3 space-x-2">
                  <Button
                    variant="link"
                    onClick={() => {
                      fetchProductById(p.id);
                      setForm({
                        name: p.name,
                        category: p.category || "",
                        originalPrice: p.originalPrice,
                        discountedPrice: p.discountedPrice,
                        description: p.description || "",
                        ingredients: Array.isArray(p.ingredients)
                          ? p.ingredients.join(", ")
                          : typeof p.ingredients === "string"
                            ? JSON.parse(p.ingredients || "[]").join(", ")
                            : "",
                        image: null,
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

<Dialog open={openAdd} onOpenChange={setOpenAdd}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Product</DialogTitle>
    </DialogHeader>

    <div className="space-y-3">
      <Label>Name</Label>
      <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />

      <Label>category</Label>
      <Select
        value={form.category}
        onValueChange={(value) => setForm({ ...form, category: value })}
      >
        <SelectTrigger className="bg-white border border-input">
          <SelectValue placeholder="Select product category" />
        </SelectTrigger>

        <SelectContent className="bg-white border shadow-lg z-50">
          {PRODUCT_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>


      <Label>Original Price(INR)</Label>
      <Input type="number" value={form.originalPrice}
        onChange={e => setForm({ ...form, originalPrice: e.target.value })} />

      <Label>Discounted Price(INR)</Label>
      <Input type="number" value={form.discountedPrice}
        onChange={e => setForm({ ...form, discountedPrice: e.target.value })} />

      <Label>Description</Label>
      <Input value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })} />

      <Label>Ingredients (comma separated)</Label>
      <Input value={form.ingredients}
        onChange={e => setForm({ ...form, ingredients: e.target.value })} />

      <Label>Image</Label>
      <Input
        type="file"
        accept="image/*"
        onChange={e => setForm({ ...form, image: e.target.files?.[0] })}
      />
    </div>

    <DialogFooter>
      <Button onClick={handleAddProduct} className="bg-primary text-white">
        Add Product
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog open={openEdit} onOpenChange={setOpenEdit}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Product</DialogTitle>
    </DialogHeader>

    {selectedProduct && (
      <div className="space-y-3">
        {selectedProduct.image && (
          <img
            src={selectedProduct.image}
            className="h-24 w-24 rounded border object-cover"
          />
        )}

        <Label>Name</Label>
        <Input value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <Label>category</Label>
        <Select
          value={form.category}
          onValueChange={(value) => setForm({ ...form, category: value })}
        >
          <SelectTrigger className="bg-white border border-input">
            <SelectValue placeholder="Select product category" />
          </SelectTrigger>

          <SelectContent className="bg-white border shadow-lg z-50">
            {PRODUCT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>Original Price(INR)</Label>
        <Input type="number" value={form.originalPrice}
          onChange={e => setForm({ ...form, originalPrice: e.target.value })} />

        <Label>Discounted Price(INR)</Label>
        <Input type="number" value={form.discountedPrice}
          onChange={e => setForm({ ...form, discountedPrice: e.target.value })} />

        <Label>Ingredients</Label>
        <Input value={form.ingredients}
          onChange={e => setForm({ ...form, ingredients: e.target.value })} />

        <Label>Replace Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={e => setForm({ ...form, image: e.target.files?.[0] })}
        />
      </div>
    )}

    <DialogFooter>
      <Button onClick={handleEditProduct} className="bg-primary text-white">
        Save Changes
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<Dialog open={openView} onOpenChange={setOpenView}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Product Details</DialogTitle>
    </DialogHeader>

    {selectedProduct ? (
      <div className="space-y-4">

        {/* Image */}
        {selectedProduct.image && (
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
            className="w-full h-56 object-cover rounded-lg border"
          />
        )}

        {/* Name */}
        <div>
          <Label>Name</Label>
          <p className="font-medium">{selectedProduct.name}</p>
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <p className="capitalize text-gray-600">
            {selectedProduct.category || "-"}
          </p>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Original Price</Label>
            <p>₹{selectedProduct.originalPrice}</p>
          </div>

          <div>
            <Label>Discounted Price</Label>
            <p className="text-green-600">
              ₹{selectedProduct.discountedPrice}
            </p>
          </div>
        </div>

        {/* Description */}
        {selectedProduct.description && (
          <div>
            <Label>Description</Label>
            <p className="text-sm text-gray-700">
              {selectedProduct.description}
            </p>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <Label>Ingredients</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {(Array.isArray(selectedProduct.ingredients)
              ? selectedProduct.ingredients
              : typeof selectedProduct.ingredients === "string"
                ? JSON.parse(selectedProduct.ingredients || "[]")
                : []
            ).map((ing: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <Label>Created At</Label>
            <p>
              {new Date(selectedProduct.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <Label>Updated At</Label>
            <p>
              {new Date(selectedProduct.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <p className="text-center text-gray-400">Loading...</p>
    )}

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpenView(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </div>
  );
}
