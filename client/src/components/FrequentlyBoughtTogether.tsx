import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { isOutOfStock } from "@/lib/stock";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";

type BundleProduct = {
  id: string | number;
  name: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  stock?: number | null;
};

export const FrequentlyBoughtTogether = ({
  currentProduct,
  products = [],
  loading = false,
}: {
  currentProduct: BundleProduct;
  products: BundleProduct[];
  loading?: boolean;
}) => {
  const [addingAll, setAddingAll] = useState(false);
  const addToCart = useCartStore((s) => s.addToCart);
  const setOpenCart = useUIStore((s) => s.setOpenCart);
  const setOpenSearch = useUIStore((s) => s.setOpenSearch);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          Loading frequently bought products...
        </div>
      </section>
    );
  }

  const extraProducts = products
    .filter((p) => String(p.id) !== String(currentProduct.id))
    .filter((p) => !isOutOfStock(p.stock))
    .slice(0, 2);

  if (!extraProducts.length || isOutOfStock(currentProduct.stock)) return null;

  const bundleItems = [currentProduct, ...extraProducts];
  const totalOriginal = bundleItems.reduce(
    (acc, p) => acc + Number(p.originalPrice || 0),
    0
  );
  const totalDiscounted = bundleItems.reduce(
    (acc, p) => acc + Number(p.discountedPrice || 0),
    0
  );
  const saved = Math.max(totalOriginal - totalDiscounted, 0);

  const handleAddSingle = async (product: BundleProduct) => {
    await addToCart(product.id, {
      name: product.name,
      image: product.image,
      originalPrice: product.originalPrice,
      discountedPrice: product.discountedPrice,
      stock: product.stock,
    });
    setOpenSearch(false);
    setOpenCart(true);
  };

  const handleAddAll = async () => {
    try {
      setAddingAll(true);

      // results were previously discarded, so a rejected line vanished
      // silently and the customer believed they had the whole bundle
      const failed: string[] = [];

      for (const item of bundleItems) {
        const res = await addToCart(item.id, {
          name: item.name,
          image: item.image,
          originalPrice: item.originalPrice,
          discountedPrice: item.discountedPrice,
          stock: item.stock,
        });

        if (res && res.success === false) failed.push(item.name);
      }

      if (failed.length === bundleItems.length) {
        toast.error("Couldn't add the bundle — those items aren't available");
      } else if (failed.length) {
        toast.warning(`Added the rest, but ${failed.join(" and ")} couldn't be added`);
      }

      setOpenSearch(false);
      setOpenCart(true);
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <section className="bg-zinc-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold text-center">Frequently Bought Together</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {bundleItems.map((product, index) => (
            <div key={product.id} className="flex items-center">
              <Card className="w-52 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 flex flex-col items-center">
                  <Link to={`/products/${product.id}`} className="w-full flex flex-col items-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-md mb-3"
                    />
                    <p className="font-semibold text-sm text-center line-clamp-2 min-h-10">
                      {product.name}
                    </p>
                  </Link>
                  <p className="text-primary font-bold mt-2">₹{product.discountedPrice}</p>
                  {product.originalPrice > product.discountedPrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      ₹{product.originalPrice}
                    </p>
                  )}
                  <Button
                    className="mt-3 w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold"
                    onClick={() => handleAddSingle(product)}
                  >
                    ADD TO CART
                  </Button>
                </CardContent>
              </Card>

              {index < bundleItems.length - 1 && (
                <Plus className="mx-3 text-muted-foreground" size={28} />
              )}
            </div>
          ))}

          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-zinc-50 p-6 rounded-2xl shadow-lg border border-zinc-200 w-64">
            <p className="text-sm text-muted-foreground">
              Total Price ({bundleItems.length} items)
            </p>

            <h3 className="text-2xl font-bold text-primary mt-2">₹{totalDiscounted}</h3>

            <p className="text-xs text-muted-foreground line-through mt-1">
              MRP ₹{totalOriginal}
            </p>

            {saved > 0 && (
              <p className="text-sm font-semibold text-green-600 mt-1">
                You save ₹{saved}
              </p>
            )}

            <Button
              className="mt-4 w-full bg-primary text-white hover:bg-primary/90 rounded-full font-bold"
              onClick={handleAddAll}
              disabled={addingAll}
            >
              {addingAll ? "ADDING..." : "ADD ALL TO CART"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
