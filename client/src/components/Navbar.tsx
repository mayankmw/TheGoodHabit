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
import { useNavigate } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";

const categories = [
  { name: "All Products", image: "/images/categories/all.avif" }
];

const menuItems = [
  { label: "Shop by Category", href: "#category", hasSubmenu: true },
  { label: "Our Story", href: "/our-story" },
  { label: "Track Your Order", href: "/track-order" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  
const openSearch = useUIStore((s) => s.openSearch);
const setOpenSearch = useUIStore((s) => s.setOpenSearch);

const cartOpen = useUIStore((s) => s.openCart);
const setOpenCart = useUIStore((s) => s.setOpenCart);
const [showCoupons, setShowCoupons] = useState(false);

  const { recommended, fetchRecommended } = useProductStore();
  const { searchProducts } = useProductStore();

const cart = useCartStore((s) => s.cart);
const fetchCart = useCartStore((s) => s.fetchCart);
const removeFromCart = useCartStore((s) => s.removeFromCart);
const updateQuantity = useCartStore((s) => s.updateQuantity);

const token = localStorage.getItem("token");

// 🔥 Load cart ONCE at mount if logged in
useEffect(() => {
  if (token) {
    fetchCart();
  }
}, [token]);

// 🔥 Also re-fetch when cart is opened (optional)
useEffect(() => {
  if (cartOpen) {
    fetchCart();
  }
}, [cartOpen]);

// Correct cart count
const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

const cartTotal = cart.reduce((s, it) => s + (it.discountedPrice || 0) * it.quantity, 0);

// ---------- add near other hooks/state in Navbar ----------
// constants & state
const FREE_GIFT_THRESHOLD = 999;
const cartId = useCartStore((s) => s.cartId);

const [coupons, setCoupons] = useState([
  { code: "GET100", title: "Flat ₹100.0 off", minOrder: 799, savingsText: "Save ₹100 on this order!", available: true },
  { code: "SUMMER30", title: "30% off", minOrder: 8999, savingsText: null, available: false },
]);

// awarded status persists per cart (do not re-award)
const [freeGiftAwarded, setFreeGiftAwarded] = useState(false);

// animation flag — toggles true briefly whenever we want the poppers animation
const [showPoppers, setShowPoppers] = useState(false);

// small helper to add FREEGIFT coupon (idempotent)
const awardFreeGiftCoupon = () => {
  const freeGiftCoupon = {
    code: "FREEGIFT",
    title: "Get 1 item for free",
    minOrder: FREE_GIFT_THRESHOLD,
    savingsText: "Enjoy a free gift!",
    available: true,
    autoAwarded: true,
  };

  setCoupons((prev) => {
    if (prev.find((c) => c.code === freeGiftCoupon.code)) return prev;
    return [freeGiftCoupon, ...prev];
  });
};


// ---------- effect to award coupon when threshold reached ----------
useEffect(() => {
  if (!cartId) return;
  const key = `freeGift_awarded_cart_${cartId}`;
  const already = localStorage.getItem(key) === "1";

  // if cartTotal meets threshold and not awarded, award and persist
  if (cartTotal >= FREE_GIFT_THRESHOLD && !already) {
    awardFreeGiftCoupon();
    localStorage.setItem(key, "1");
    setFreeGiftAwarded(true);
  } else if (already) {
    setFreeGiftAwarded(true);
  }
}, [cartId, cartTotal]);

useEffect(() => {
  // play poppers every time cartTotal >= threshold (but only if cart has items)
  if (cartTotal >= FREE_GIFT_THRESHOLD && cart.length > 0) {
    // toggle to trigger animation; use short debounce so rapid changes still show
    setShowPoppers(false);
    // allow React to re-render then show
    requestAnimationFrame(() => {
      setShowPoppers(true);
      // hide after animation duration
      setTimeout(() => setShowPoppers(false), 1600);
    });
  }
}, [cartTotal]);



const handleOpenSearch = () => {
  setOpenSearch(true);
  setOpenCart(false);
  setOpen(false);
};

const handleOpenCart = () => {
  setOpenCart(true);
  setOpenSearch(false);
  setOpen(false);
};


  const handleOpenMenu = () => {
    setOpen(true);
    setOpenCart(false);
    setOpenSearch(false);
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
                  src="/images/logo/logo2.png"
                  alt="Logo"
                  className="h-20 w-25 object-contain drop-shadow-md"
                />
              </a>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-0.2 sm:gap-2">
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
              <Sheet open={cartOpen} onOpenChange={setOpenCart}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary/80 relative"
                    onClick={handleOpenCart}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
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
                    onClick={() => setOpenCart(false)} // <-- your state handler
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 🧾 Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4">
                  {/* 🎁 Free Gift Progress */}
<div className="bg-secondary/10 rounded-xl p-4 mt-4 mb-6 relative overflow-hidden">
  <p className="text-center text-sm font-semibold text-green-700">
    {cartTotal >= FREE_GIFT_THRESHOLD
        ? <span>You have successfully reached the milestone</span>
        : <span> Get a free gift by adding items worth ₹{FREE_GIFT_THRESHOLD}</span>}
  </p>

{/* Animated poppers overlay */}
{showPoppers && (
  <div className="absolute inset-0 z-30 pointer-events-none flex items-start justify-center">
    <div className="w-full relative h-0">
      {Array.from({ length: 12 }).map((_, i) => {
        const leftPct = 8 + (i * 7); // spread across width
        const delay = (i % 5) * 80;
        return (
          <div
            key={i}
            className="popper"
            style={{
              left: `${leftPct}%`,
              animationDelay: `${delay}ms`,
            }}
          >
            <div className="popper-inner">
              {/* simple icon variants */}
              {i % 3 === 0 ? "🎉" : i % 3 === 1 ? "🎁" : "✨"}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}


  <div className="relative mt-3">
    <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
      <div
        className="bg-secondary h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.round((cartTotal / FREE_GIFT_THRESHOLD) * 100))}%` }}
      ></div>
    </div>

    {/* gift badge that shifts based on progress (keeps inside progress area) */}
    <div
      className="absolute top-[-10px] bg-white border border-secondary rounded-full w-8 h-8 flex items-center justify-center text-secondary text-xs font-bold shadow transition-transform"
      style={{
        right: `${Math.max(0, 100 - Math.min(100, Math.round((cartTotal / FREE_GIFT_THRESHOLD) * 100)))}%`,
        transform: `translateX(${Math.min(0, Math.round((cartTotal / FREE_GIFT_THRESHOLD) * 100) - 100)}%)`
      }}
      aria-hidden
    >
      🎁
    </div>

    <p className="text-xs text-right mt-2 text-green-700 font-medium">
      ₹{FREE_GIFT_THRESHOLD} Free Gift
    </p>
  </div>
</div>


                  {/* 🛍️ Cart Items */}
                  <div className="space-y-4">
                  {cart.map((item) => (
                    <div className="flex gap-3 border rounded-xl p-3" key={item.cartItemId}>
                      <img src={item.image} className="w-20 h-20 rounded-lg" />

                      <div className="flex-1">
                        <div>
                      <h3 className="text-sm font-semibold">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-muted-foreground line-through text-xs">
                          ₹{item.originalPrice}
                        </p>
                        <p className="text-sm font-bold">₹{item.discountedPrice}</p>
                          </div>
                        </div>                                                      

                        <div className="flex justify-between items-center mt-2">

                          <div className="flex items-center gap-2 border rounded-md px-2">
                          <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}>–</button>
                            <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}>+</button>
                          </div>

                          <Button 
                            variant="ghost" 
                            className="text-xs text-destructive"
                            onClick={() => removeFromCart(item.cartItemId)}
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
  {/* Header row */}
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-semibold text-sm">Coupons</h4>

    {/* compact view: show cart value and button to open coupon panel */}
    {!showCoupons ? (
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCoupons(true)}
          className="flex items-center gap-2 text-sm bg-primary/5 px-3 py-1 rounded-md hover:bg-primary/10"
        >
          View coupons <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowCoupons(false)}
          className="p-1 rounded-md hover:bg-border/40"
          aria-label="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    )}
  </div>

  {/* Coupon list panel */}
  {showCoupons ? (
    <div className="space-y-4">
      {coupons.filter(c => c.available).map((c) => (
        <div key={c.code} className="bg-white border rounded-lg p-4 flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full border flex items-center justify-center text-primary">
                %{/* icon placeholder */}
              </div>
              <strong className="text-sm">{c.code}</strong>
            </div>
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-1">on orders above ₹{c.minOrder}.0</div>
            {c.savingsText && <div className="text-xs text-green-700 mt-2">{c.savingsText}</div>}
          </div>

          <div>
            <button
              className="bg-[#7fc3ba] text-white px-4 py-2 rounded-lg font-semibold"
              onClick={() => {
                // apply coupon logic here (call API or set state)
                console.log("apply", c.code);
                setShowCoupons(false);
              }}
            >
              Apply
            </button>
          </div>
        </div>
      ))}

      {/* Unavailable section */}
      <div>
        <h5 className="text-xs font-semibold text-muted-foreground mb-2">UNAVAILABLE COUPONS</h5>

        {coupons.filter(c => !c.available).map((c) => (
          <div key={c.code} className="bg-white border rounded-lg p-4 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full border flex items-center justify-center text-muted-foreground">%</div>
              <strong className="text-sm text-muted-foreground">{c.code}</strong>
            </div>
            <div className="text-sm font-semibold">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-1">on orders above ₹{c.minOrder}.0</div>
            <div className="text-xs text-red-600 mt-2">Add ₹{Math.max(0, c.minOrder - cartTotal)} more to avail this offer</div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    // compact view when panel closed: small CTA and coupon summary
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-center justify-between">
      <div>
        <div className="font-semibold">₹100 savings with <strong>GET100</strong> ✅</div>
        <div className="text-xs text-muted-foreground">Tap "View coupons" to see more</div>
      </div>
      <button
        onClick={() => setShowCoupons(true)}
        className="text-xs text-green-700 font-semibold hover:underline"
      >
        View
      </button>
    </div>
  )}
</div>


                  {/* ⭐ Special Offers */}
                  <div className="mt-6 mb-4">
                    <h4 className="font-semibold text-sm mb-3">Special Offers For You</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {recommended.map((item, index) => (
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
                    <span>₹{cartTotal}</span>
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
      {openSearch && (
        <div className="fixed top-0 left-0 w-full bg-background shadow-md border-b border-border z-[60] animate-fadeIn">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenSearch(false)}
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
                      <ProductCardMini
                        id={product.id}
                        image={product.image}
                        name={product.name}
                        rating={product.rating}
                        reviews={product.reviews}
                        originalPrice={product.originalPrice}
                        discountedPrice={product.discountedPrice}
                      />
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
                      <ProductCardMini
                        id={product.id}
                        image={product.image}
                        name={product.name}
                        rating={product.rating}
                        reviews={product.reviews}
                        originalPrice={product.originalPrice}
                        discountedPrice={product.discountedPrice}
                      />
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
