import { useEffect, useState } from "react";
import {
  Menu,
  Search,
  User,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductCardMini } from "@/components/ProductCardMini";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";

const categories = [
  { name: "All Products", image: "/images/categories/all.avif" },
  { name: "Dates", image: "/images/categories/breakfast.avif" }
];

const recommendedProducts = [
  {
    id: "choco-bar",
    name: "Chocolate Protein Bar",
    image: "/images/products/product1.webp",
    price: 249,
  },
  {
    id: "almond-dates-combo",
    name: "Almond Dates Combo",
    image: "/images/products/product2.webp",
    price: 499,
  },
  {
    id: "pb-minis",
    name: "Peanut Butter Minis",
    image: "/images/products/product3.webp",
    price: 299,
  },
  {
    id: "kunafa-protein-dates",
    name: "Kunafa Protein Dates",
    image: "/images/products/product4.webp",
    price: 399,
  },
];

const menuItems = [
  { label: "Shop by Category", href: "#category", hasSubmenu: true },
  { label: "Our Story", href: "/our-story" },
  { label: "Track Your Order", href: "/track-order" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { recommended, fetchRecommended } = useProductStore();
  const { searchProducts } = useProductStore();

  // helper functions to prevent multiple overlays open
  const handleOpenSearch = () => {
    setShowSearch(true);
    setCartOpen(false);
    setOpen(false);
  };

  const handleOpenCart = () => {
    setCartOpen(true);
    setShowSearch(false);
    setOpen(false);
  };

  const handleOpenMenu = () => {
    setOpen(true);
    setCartOpen(false);
    setShowSearch(false);
  };

  const navigate = useNavigate();

  const handleUserClick = () => {
    const isLoggedIn = Boolean(localStorage.getItem("token"));

    if (isLoggedIn) {
      navigate("/profile"); 
    } else {
      navigate("/signin");
    }
  };

  useEffect(() => {
  fetchRecommended();
}, []);

// ADD THIS AT TOP
const [query, setQuery] = useState("");
const [results, setResults] = useState([]);
const [searching, setSearching] = useState(false);

// 🔍 Debounced Search Handler
useEffect(() => {
  const delay = setTimeout(async () => {
    if (query.trim().length === 0) {
      setResults([]); // reset
      return;
    }

    setSearching(true);
    const res = await searchProducts(query);
    setSearching(false);

    if (res.success) {
      setResults(res.products);
    }
  }, 400);

  return () => clearTimeout(delay);
}, [query, recommended]);


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
                  onClick={handleOpenMenu}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>

              <SheetContent
                side="left"
                className="w-80 bg-accent text-accent-foreground overflow-y-auto inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent)]"
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
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>

                        {/* {submenuOpen && (
                          <div className="fixed left-80 top-20 w-[calc(100vw-20rem)] bg-[#3C0080] p-10 z-40 overflow-y-auto">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                              {categories.map((cat) => (
                                <a
                                  key={cat.name}
                                  href={`#${cat.name.toLowerCase()}`}
                                  className="bg-[#FFF6E9] rounded-2xl p-4 flex flex-col justify-between hover:scale-105 transition-transform duration-300"
                                  onClick={() => setOpen(false)}
                                >
                                  <div className="font-semibold text-[#1E1E1E] text-lg leading-tight mb-3">
                                    {cat.name}
                                  </div>
                                  <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="w-full h-32 object-contain"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )} */}

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
                onClick={handleOpenSearch}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUserClick}
                className="text-primary-foreground hover:bg-primary/80"
              >
                <User className="h-6 w-6 cursor-pointer" />
              </Button>

              {/* 🛒 Cart Sidebar */}
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary/80 relative"
                    onClick={handleOpenCart}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      2
                    </span>
                  </Button>
                </SheetTrigger>

              <SheetContent
                side="right"
                className="w-96 bg-background text-foreground flex flex-col h-full shadow-2xl !p-0 [&>button.absolute]:hidden"
              >
                {/* 🧱 Sticky Header */}
                <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" /> Your Cart
                  </h2>
                  <button
                    onClick={() => setCartOpen(false)} // <-- your state handler
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 🧾 Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4">
                  {/* 🎁 Free Gift Progress */}
                  <div className="bg-secondary/10 rounded-xl p-4 mt-4 mb-6">
                    <p className="text-center text-sm font-semibold text-green-700">
                      Get a free gift by adding items worth ₹999
                    </p>
                    <div className="relative mt-3">
                      <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-secondary h-2 rounded-full transition-all duration-500"
                          style={{ width: "60%" }}
                        ></div>
                      </div>
                      <div className="absolute right-0 top-[-6px] bg-white border border-secondary rounded-full w-6 h-6 flex items-center justify-center text-secondary text-xs font-bold shadow">
                        🎁
                      </div>
                      <p className="text-xs text-right mt-2 text-green-700 font-medium">
                        ₹999 Free Gift
                      </p>
                    </div>
                  </div>

                  {/* 🛍️ Cart Items */}
                  <div className="space-y-4">
                    {recommendedProducts.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-3 border border-border/50 rounded-xl p-3 shadow-sm hover:shadow-md transition"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex flex-col justify-between w-full">
                          <div>
                            <h3 className="text-sm font-semibold">{item.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-muted-foreground line-through text-xs">
                                ₹{item.price + 50}
                              </p>
                              <p className="text-sm font-bold">₹{item.price}</p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2 border rounded-md px-2">
                              <button className="text-lg">−</button>
                              <span className="text-sm font-medium">1</span>
                              <button className="text-lg">+</button>
                            </div>
                            <Button
                              variant="ghost"
                              className="text-xs text-destructive w-fit p-0 hover:text-destructive/80"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 💸 Offers & Rewards */}
                  <div className="mt-6 border border-border/40 rounded-xl p-4">
                    <h4 className="font-semibold mb-2 text-sm">Offers & Rewards</h4>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center text-sm">
                      <span>
                        ₹100 savings with <strong>'GET100'</strong> ✅
                      </span>
                      <button className="text-xs text-green-700 font-semibold hover:underline">
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground underline cursor-pointer">
                      Enter a coupon code
                    </p>
                  </div>

                  {/* ⭐ Special Offers */}
                  <div className="mt-6 mb-4">
                    <h4 className="font-semibold text-sm mb-3">Special Offers For You</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {recommendedProducts.map((item, index) => (
                        <div
                          key={index}
                          className="min-w-[120px] border border-border/50 rounded-lg p-2 relative"
                        >
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold rounded px-1.5 py-0.5">
                            10% OFF
                          </div>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-24 object-cover rounded-md mb-1"
                          />
                          <p className="text-xs font-semibold line-clamp-2">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 💰 Sticky Checkout Footer */}
                <div className="sticky bottom-0 border-t border-border bg-background p-4">
                  <div className="flex justify-between text-sm font-semibold mb-3">
                    <span>Estimated Total</span>
                    <span>₹748</span>
                  </div>
                  <Button className="mt-4 w-full bg-primary text-white hover:bg-primary/90 rounded-full font-bold">
                    Checkout
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    🔒 Secured by
                    <img
                      src="/images/logo/razorpay-icon.svg"
                      alt="Razorpay"
                      className="h-3 w-auto inline-block"
                    />
                  </p>
                </div>
              </SheetContent>


              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* 🔍 Search Overlay */}
      {showSearch && (
        <div className="fixed top-0 left-0 w-full bg-background shadow-md border-b border-border z-[60] animate-fadeIn">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search products..."
                className="w-[90%] md:w-[60%] border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mt-8 pb-6 text-center">

              {/* Title */}
              <h3 className="font-semibold mb-6 text-base md:text-md text-muted-foreground uppercase tracking-wide">
                {query.length > 0 ? "Search Results" : "Or Select From Our Recommended Products"}
              </h3>

              {/* 🔄 Loading */}
              {searching && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}

              {/* 🔍 Search Results */}
              {query.length > 0 && !searching && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={() => setShowSearch(false)}
                      className="max-w-[220px] mx-auto transform transition hover:scale-105"
                    >
                      <ProductCardMini
                        image={product.image}
                        name={product.name}
                        rating={product.rating}
                        reviews={product.reviews}
                        originalPrice={product.originalPrice}
                        discountedPrice={product.discountedPrice}
                      />
                    </Link>
                  ))}
                </div>
              )}

              {/* ❌ No results */}
              {query.length > 0 && !searching && results.length === 0 && (
                <p className="text-sm text-muted-foreground">No products found.</p>
              )}

              {/* ⭐ Recommended Products */}
              {query.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
                  {recommended.map((product) => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={() => setShowSearch(false)}
                      className="max-w-[220px] mx-auto transform transition hover:scale-105"
                    >
                      <ProductCardMini
                        image={product.image}
                        name={product.name}
                        rating={product.rating}
                        reviews={product.reviews}
                        originalPrice={product.originalPrice}
                        discountedPrice={product.discountedPrice}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};
