import { useEffect, useMemo, useState } from "react";
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

type ProductForm = {
  name: string;
  category: string;
  originalPrice: string | number;
  discountedPrice: string | number;
  description: string;
  ingredients: string;
  images: File[];
  existingImages: string[];
};

type ProductRecord = {
  id: string | number;
  name: string;
  image?: string | null;
  images?: unknown;
  gallery?: unknown;
  additionalImages?: unknown;
  category?: string;
  originalPrice?: number | string;
  discountedPrice?: number | string;
  description?: string;
  ingredients?: unknown;
  createdAt?: string;
  updatedAt?: string;
};

const PRODUCT_CATEGORIES = [
  { label: "Dates", value: "dates" },
  { label: "Snacks", value: "snacks" },
  { label: "Protein Bar", value: "protein_bar" },
  { label: "Breakfast", value: "breakfast" },
];

const createEmptyForm = (): ProductForm => ({
  name: "",
  category: "",
  originalPrice: "",
  discountedPrice: "",
  description: "",
  ingredients: "",
  images: [],
  existingImages: [],
});

const parseIngredientsText = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch {
      // keep raw text when value is not JSON
    }
    return value;
  }
  return "";
};

const parseIngredientsList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const getProductImages = (product: ProductRecord | null | undefined): string[] => {
  if (!product) return [];

  const parseSource = (source: unknown): string[] => {
    if (Array.isArray(source)) {
      return source
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }

    if (typeof source === "string") {
      const trimmed = source.trim();
      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter(Boolean);
        }
      } catch {
        return [trimmed];
      }
    }

    return [];
  };

  const images = new Set<string>();
  if (typeof product.image === "string" && product.image.trim()) {
    images.add(product.image);
  }

  [product.images, product.gallery, product.additionalImages].forEach((source) => {
    parseSource(source).forEach((image) => images.add(image));
  });

  return Array.from(images);
};

export default function AdminProducts() {
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
  const [form, setForm] = useState<ProductForm>(createEmptyForm());

  const newImagePreviews = useMemo(
    () => form.images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.images]
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [newImagePreviews]);

  const hydrateFormFromProduct = (product: ProductRecord | null | undefined) => {
    setForm({
      name: product?.name || "",
      category: product?.category || "",
      originalPrice: product?.originalPrice || "",
      discountedPrice: product?.discountedPrice || "",
      description: product?.description || "",
      ingredients: parseIngredientsText(product?.ingredients),
      images: [],
      existingImages: getProductImages(product),
    });
  };

  const handleSelectImages = (files: File[]) => {
    if (!files.length) return;
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const removeNewImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeExistingImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((img) => img !== imageUrl),
    }));
  };

  const handleAddProduct = async () => {
    const res = await createProduct({
      ...form,
      ingredients: form.ingredients
        ? form.ingredients.split(",").map((i: string) => i.trim()).filter(Boolean)
        : [],
    });

    if (res?.success) {
      toast.success(res?.message);
      setOpenAdd(false);
      setForm(createEmptyForm());
    } else {
      toast.error(res?.message || "Failed to add product");
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct?.id) return;

    const res = await updateProduct({
      id: selectedProduct.id,
      ...form,
      ingredients: form.ingredients
        ? form.ingredients.split(",").map((i: string) => i.trim()).filter(Boolean)
        : [],
    });

    if (res?.success) {
      toast.success(res?.message);
      setOpenEdit(false);
      setForm(createEmptyForm());
    } else {
      toast.error(res?.message || "Failed to update product");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  if (loadingProducts) {
    return <p className="text-center mt-10 text-gray-400">Loading products...</p>;
  }

  if (!products.length) {
    return <p className="text-center mt-10 text-gray-400">No products found</p>;
  }

  const productList = products as ProductRecord[];
  const selectedProductData = selectedProduct as ProductRecord | null;
  const selectedProductImages = getProductImages(selectedProductData);

  return (
    <div className="p-8 space-y-6 bg-gradient-to-b from-amber-50 to-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>

        <Button
          className="bg-primary text-white"
          onClick={() => {
            setForm(createEmptyForm());
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
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Price(INR)</th>
              <th className="px-4 py-3 text-left">Discounted(INR)</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {productList.map((p) => {
              const image = getProductImages(p)[0];

              return (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {image ? (
                      <img
                        src={image}
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
                  <td className="px-4 py-3 text-green-600">₹{p.discountedPrice}</td>

                  <td className="px-4 py-3 space-x-2">
                    <Button
                      variant="link"
                      onClick={async () => {
                        await fetchProductById(p.id);
                        const current = (useAdminStore.getState().selectedProduct as ProductRecord | null) || p;
                        hydrateFormFromProduct(current);
                        setOpenEdit(true);
                      }}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              );
            })}
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
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

            <Label>Category</Label>
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
            <Input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
            />

            <Label>Discounted Price(INR)</Label>
            <Input
              type="number"
              value={form.discountedPrice}
              onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
            />

            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Label>Ingredients (comma separated)</Label>
            <Input
              value={form.ingredients}
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            />

            <Label>Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
                handleSelectImages(selectedFiles);
                e.currentTarget.value = "";
              }}
            />

            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {newImagePreviews.map((preview, index) => (
                  <div key={`${preview.file.name}-${index}`} className="relative">
                    <img
                      src={preview.url}
                      alt={preview.file.name}
                      className="h-16 w-full rounded border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black text-white text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          {selectedProductData && (
            <div className="space-y-3">
              {form.existingImages.length > 0 && (
                <>
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {form.existingImages.map((image) => (
                      <div key={image} className="relative">
                        <img
                          src={image}
                          alt="Current product image"
                          className="h-16 w-full rounded border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black text-white text-xs"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

              <Label>Category</Label>
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
              <Input
                type="number"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              />

              <Label>Discounted Price(INR)</Label>
              <Input
                type="number"
                value={form.discountedPrice}
                onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
              />

              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <Label>Ingredients</Label>
              <Input
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              />

              <Label>Add More Images</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
                  handleSelectImages(selectedFiles);
                  e.currentTarget.value = "";
                }}
              />

              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {newImagePreviews.map((preview, index) => (
                    <div key={`${preview.file.name}-${index}`} className="relative">
                      <img
                        src={preview.url}
                        alt={preview.file.name}
                        className="h-16 w-full rounded border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black text-white text-xs"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {selectedProductData ? (
            <div className="space-y-4">
              {selectedProductImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedProductImages.map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={selectedProductData.name}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              )}

              <div>
                <Label>Name</Label>
                <p className="font-medium">{selectedProductData.name}</p>
              </div>

              <div>
                <Label>Category</Label>
                <p className="capitalize text-gray-600">
                  {selectedProductData.category || "-"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Original Price</Label>
                  <p>₹{selectedProductData.originalPrice}</p>
                </div>

                <div>
                  <Label>Discounted Price</Label>
                  <p className="text-green-600">
                    ₹{selectedProductData.discountedPrice}
                  </p>
                </div>
              </div>

              {selectedProductData.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-gray-700">{selectedProductData.description}</p>
                </div>
              )}

              <div>
                <Label>Ingredients</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {parseIngredientsList(selectedProductData.ingredients).map((ing, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label>Created At</Label>
                  <p>{selectedProductData.createdAt ? new Date(selectedProductData.createdAt).toLocaleDateString() : "-"}</p>
                </div>

                <div>
                  <Label>Updated At</Label>
                  <p>{selectedProductData.updatedAt ? new Date(selectedProductData.updatedAt).toLocaleDateString() : "-"}</p>
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
