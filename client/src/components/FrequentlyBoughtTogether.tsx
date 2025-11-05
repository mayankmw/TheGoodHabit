import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Chocolate Protein Bar",
    image: "/images/products/product1.webp",
    price: 249,
  },
  {
    id: 2,
    name: "Almond Dates Combo",
    image: "/images/products/product2.webp",
    price: 499,
  },
  {
    id: 3,
    name: "Peanut Butter Minis",
    image: "/images/products/product3.webp",
    price: 299,
  },
];

export const FrequentlyBoughtTogether = () => {
  const total = products.reduce((acc, p) => acc + p.price, 0);

  return (
    <section className="bg-zinc-50 py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-2xl font-bold text-center">Frequently Bought Together</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center">
              <Card className="w-48 shadow-md hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 flex flex-col items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-md mb-3"
                  />
                  <p className="font-semibold text-sm text-center">{product.name}</p>
                  <p className="text-primary font-bold mt-2">₹{product.price}</p>
                </CardContent>
              </Card>

              {index < products.length - 1 && (
                <Plus className="mx-3 text-muted-foreground" size={28} />
              )}
            </div>
          ))}

          {/* Total Section */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-white to-zinc-50 p-6 rounded-2xl shadow-lg border border-zinc-200 w-64">
            <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full mb-3 uppercase">
              Bundle Offer – Save 10%
            </div>

            <p className="text-sm text-muted-foreground">Total Price (3 items)</p>

            {/* Example: 10% discount */}
            <h3 className="text-2xl font-bold text-primary mt-2">₹{Math.round(total * 0.9)}</h3>

            <p className="text-xs text-muted-foreground line-through mt-1">
              MRP ₹{total}
            </p>

            <p className="text-sm font-semibold text-green-600 mt-1">
              You save ₹{Math.round(total * 0.1)} (10%)
            </p>

            <Button className="mt-4 w-full bg-primary text-white hover:bg-primary/90 rounded-full font-bold">
              Add all to cart
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
};
