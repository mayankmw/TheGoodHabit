import { useState } from "react";
import {
  Menu,
  Search,
  User,
  ShoppingCart,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductCardMini } from "@/components/ProductCardMini";

const categories = [
  { name: "All Products", image: "/images/categories/all.avif" },
  { name: "Breakfast", image: "/images/categories/breakfast.avif" },
  { name: "Bars", image: "/images/categories/bars.avif" },
  { name: "Dry Fruits", image: "/images/categories/dry-fruits.avif" },
];

const recommendedProducts = [
  {
    name: "Chocolate Protein Bar",
    image: "/images/products/product1.webp",
    price: 249,
  },
  {
    name: "Almond Dates Combo",
    image: "/images/products/product2.webp",
    price: 499,
  },
  {
    name: "Peanut Butter Minis",
    image: "/images/products/product3.webp",
    price: 299,
  },
  {
    name: "Kunafa Protein Dates",
    image: "/images/products/product4.webp",
    price: 399,
  },
];


const menuItems = [
  { label: "Shop by Category", href: "#category", hasSubmenu: true },
  { label: "Our Story", href: "/our-story" },
  { label: "Track Your Order", href: "#track" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 relative">
            {/* Left: Hamburger Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary/80"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-80 bg-accent text-accent-foreground overflow-y-auto"
              >
                <div className="flex flex-col gap-4 mt-8">
                  <h2 className="text-2xl font-bold mb-2">The Good Habit</h2>

                  {menuItems.map((item) =>
                    item.hasSubmenu ? (
                      <div
                        key={item.label}
                        className="border-b border-accent-foreground/20 pb-2"
                      >
                        <button
                          onClick={() => setSubmenuOpen((prev) => !prev)}
                          className="w-full flex justify-between items-center text-lg font-medium hover:text-secondary transition-colors py-2"
                        >
                          {item.label}
                          {submenuOpen ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>

                        {submenuOpen && (
                          <div className="pl-3 mt-3 grid grid-cols-2 gap-3">
                            {categories.map((cat) => (
                              <a
                                key={cat.name}
                                href={`#${cat.name.toLowerCase()}`}
                                className="flex flex-col items-center text-sm font-medium hover:text-secondary transition"
                                onClick={() => setOpen(false)}
                              >
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-20 h-20 object-cover rounded-lg shadow-2xl"
                                />
                                <span className="mt-1">{cat.name}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <a
                        key={item.label}
                        href={item.href}
                        className="text-lg font-medium hover:text-secondary transition-colors py-2 border-b border-accent-foreground/20"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </a>
                    )
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Center: Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <a href="/" className="block">
                <img
                  src="/images/logo/logo.png"
                  alt="Logo"
                  className="h-12 w-auto object-contain drop-shadow-md"
                />
              </a>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/80"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/80"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/80 relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔍 Search Bar Overlay */}
    {showSearch && (
      <div className="fixed top-0 left-0 w-full bg-background shadow-md border-b border-border z-[60] animate-fadeIn">
        <div className="container mx-auto px-4 py-6">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Type to search products..."
              className="w-[90%] md:w-[60%] border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Recommended Section */}
          <div className="mt-8 pb-6 text-center">
            <h3 className="font-semibold mb-6 text-base md:text-md text-muted-foreground uppercase tracking-wide">
              or select from our recommended products
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
              {recommendedProducts.map((product, index) => (
                <div
                  key={index}
                  className="max-w-[220px] mx-auto transform scale-90 md:scale-95 lg:scale-100 transition-transform duration-200"
                >
                  <ProductCardMini
                    {...product}
                    rating={4.5}
                    reviews={80 + index * 10}
                    discount={10}
                    originalPrice={product.price + 50}
                  />
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    )}


    </>
  );
};
