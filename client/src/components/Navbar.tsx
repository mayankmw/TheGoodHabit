import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
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
  Check,
  Shield,
  ShoppingBag,
  HeartHandshake,
  PackageSearch,
  Boxes,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ProductCardMini } from "@/components/ProductCardMini";
import { CartAddressSelector } from "@/components/CartAddressSelector";
import { useNavigate } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { usePaymentStore } from "@/store/UsePaymentStore";
import { useAddressStore } from "@/store/useAddressStore";
import Lottie from "lottie-react";
import orderSuccessAnim from "@/assets/animations/orders-success.json";
import { useAuthStore } from "@/store/useAuthStore";
import { useCommonStore } from "@/store/useCommonStore";
import { LOGO_FALLBACK } from "@/lib/assetFallbacks";

export const Navbar = () => {
  const FREE_GIFT_THRESHOLD = 999;
  const [open, setOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  // search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [loadingMoreResults, setLoadingMoreResults] = useState(false);
  const searchSentinelRef = useRef<HTMLDivElement | null>(null);
  const searchResultsContainerRef = useRef<HTMLDivElement | null>(null);

  const { assets, fetchAssets, assetsSettled } = useCommonStore();
  const logoImage =
  assets?.logo?.[0]?.image || LOGO_FALLBACK;

  // UI store
  const openSearch = useUIStore((s) => s.openSearch);
  const setOpenSearch = useUIStore((s) => s.setOpenSearch);
  const cartOpen = useUIStore((s) => s.openCart);
  const setOpenCart = useUIStore((s) => s.setOpenCart);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // product store
  const { recommended, fetchRecommended, searchProducts } = useProductStore();

  // cart store (expects the store to provide these fields / methods)
  const cart = useCartStore((s) => s.cart || []);
  const cartTotal = useCartStore((s) => s.cartTotal || 0);
  const cartTotalBeforeDiscount = useCartStore((s) => s.cartTotalBeforeDiscount || 0);
  const cartId = useCartStore((s) => s.cartId);
  const cartCoupons = useCartStore((s) => s.cartCoupons || []); // applied/awarded for this cart
  const availableCoupons = useCartStore((s) => s.availableCoupons || []); // server-provided availability
  const fetchCart = useCartStore((s) => s.fetchCart);
  const storeAddToCart = useCartStore((s) => s.addToCart);
  const applyCouponStore = useCartStore((s) => s.applyCoupon);
  const removeCartCoupon = useCartStore((s) => s.removeCartCoupon);
  const updateQuantityStore = useCartStore((s) => s.updateQuantity);
  const removeFromCartStore = useCartStore((s) => s.removeFromCart);

  const createOrder = usePaymentStore((s) => s.createOrder);
  const verifyPayment = usePaymentStore((s) => s.verifyPayment);
  const resetPayment = usePaymentStore((s) => s.reset);

  const selectedAddressId = useAddressStore((s) => s.selectedAddressId);

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const navigate = useNavigate();

  const categories = [{ name: "All Products", image: "/images/categories/all.avif" }];

  const resolveProductImage = (product: { image?: unknown; images?: unknown }) => {
    if (typeof product?.image === "string" && product.image.trim()) {
      return product.image;
    }

    if (Array.isArray(product?.images)) {
      const first = product.images.find(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      );
      if (first) return first;
    }

    if (typeof product?.images === "string" && product.images.trim()) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) {
          const first = parsed.find(
            (item): item is string => typeof item === "string" && item.trim().length > 0
          );
          if (first) return first;
        }
      } catch {
        return "";
      }
    }

    return "";
  };

  const menuItems = [
    // { label: "Shop by Category", href: "#category", hasSubmenu: true, icon: ShoppingBag },
    { label: "Our Story", href: "/our-story", hasSubmenu: false, icon: HeartHandshake },
    { label: "Bulk Order", href: "/bulk-order", hasSubmenu: false, icon: Boxes },
    { label: "Track Your Order", href: "/track-order", hasSubmenu: false, icon: PackageSearch },
  ];

  const finalMenu = [
    ...menuItems,
    ...(user?.isAdmin
      ? [
        {
          label: "Admin Panel",
          href: "/admin",
          hasSubmenu: false,
          icon: Shield,
        },
      ]
      : []),
  ];


  // --- seen coupons ref to avoid duplicate animations ---
  const seenCouponCodesRef = useRef(new Set());
  const hasReachedGiftMilestoneRef = useRef(false);
  const offerConfettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offerConfettiRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  // cart count
  const cartCount = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);
  const hasReachedGiftMilestone = cartTotalBeforeDiscount >= FREE_GIFT_THRESHOLD;

  const fmt = (n) => `₹${Number(n || 0).toFixed(0)}`;

  const triggerOfferPoppers = () => {
    const fire = offerConfettiRef.current;
    if (!fire) return;

    const baseOptions = {
      spread: 84,
      startVelocity: 34,
      gravity: 0.92,
      ticks: 170,
      scalar: 1,
      zIndex: 0,
      colors: ["#f97316", "#ec4899", "#22c55e", "#38bdf8", "#eab308", "#a855f7"],
    } as const;

    fire({
      ...baseOptions,
      particleCount: 48,
      angle: 68,
      origin: { x: 0.14, y: 0.02 },
    });

    fire({
      ...baseOptions,
      particleCount: 48,
      angle: 112,
      origin: { x: 0.86, y: 0.02 },
    });

    fire({
      ...baseOptions,
      particleCount: 30,
      spread: 110,
      startVelocity: 28,
      scalar: 0.82,
      origin: { x: 0.5, y: 0.02 },
    });

    window.setTimeout(() => {
      const layeredFire = offerConfettiRef.current;
      if (!layeredFire) return;

      layeredFire({
        ...baseOptions,
        particleCount: 24,
        spread: 88,
        startVelocity: 26,
        scalar: 0.88,
        angle: 78,
        origin: { x: 0.28, y: 0.01 },
      });

      layeredFire({
        ...baseOptions,
        particleCount: 24,
        spread: 88,
        startVelocity: 26,
        scalar: 0.88,
        angle: 102,
        origin: { x: 0.72, y: 0.01 },
      });
    }, 140);
  };

  const handleCheckout = async () => {
    try {
      // Checkout needs a signed-in (server-side) cart — send guests to sign
      // in first instead of letting the order-create call fail silently.
      if (!token) {
        setOpenCart(false);
        toast.info("Please sign in to checkout");
        navigate("/signin");
        return;
      }

      // Needs a delivery address too — keep the cart open so they can use
      // the address picker's "Add" button right there.
      if (!selectedAddressId) {
        toast.error("Please add a delivery address before checkout");
        return;
      }

      // ✅ 1. Close cart FIRST
      setOpenCart(false);

      // small delay to allow overlay to unmount
      // await new Promise((r) => setTimeout(r, 150));

      // ✅ 2. Create order
      const order = await createOrder(selectedAddressId);
      if (!order) {
        const err = usePaymentStore.getState().error;
        const message =
          (err && typeof err === "object" && "message" in err && err.message) ||
          "Unable to start checkout. Please try again.";
        toast.error(message);
        return;
      }

      const options = {
        key: order.razorpayKey,
        amount: order.amount,
        currency: "INR",
        order_id: order.orderId,

        handler: async function (response) {
          const verifyRes = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            appOrderId: order.appOrderId,
          });

          if (verifyRes?.success) {
            resetPayment();
            setOrderSuccess(true);
          }
        },

        theme: { color: "#0ea5e9" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  useEffect(() => {
    const canvas = offerConfettiCanvasRef.current;

    if (!canvas) {
      offerConfettiRef.current = null;
      return;
    }

    offerConfettiRef.current = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    return () => {
      offerConfettiRef.current?.reset();
      offerConfettiRef.current = null;
    };
  }, [cartCount, cartOpen]);

  // ---------- initial loads ----------
  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  // fetch cart on mount (and whenever auth state changes) — fetchCart
  // itself reads the guest cart from localStorage when there's no token
  useEffect(() => {
    fetchCart();
  }, [token, fetchCart]);

  // refetch when cart sidebar opens
  useEffect(() => {
    if (cartOpen) fetchCart();
  }, [cartOpen, fetchCart]);

  // ---------- search debounce ----------
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.trim().length === 0) {
        setResults([]);
        setSearching(false);
        setHasMoreResults(false);
        setSearchPage(1);
        return;
      }
      setSearching(true);
      try {
        const res = await searchProducts(query, 1);
        if (res && res.success && res.products) {
          setResults(res.products);
          setSearchPage(1);
          setHasMoreResults(Boolean(res.hasMore));
        }
      } catch (e) {
        console.warn("search error", e);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [query, searchProducts]);

  // ---------- load next page of search results ----------
  const loadMoreResults = async () => {
    if (loadingMoreResults || !hasMoreResults || query.trim().length === 0) return;

    setLoadingMoreResults(true);
    try {
      const nextPage = searchPage + 1;
      const res = await searchProducts(query, nextPage);
      if (res && res.success && res.products) {
        setResults((prev) => [...prev, ...res.products]);
        setSearchPage(nextPage);
        setHasMoreResults(Boolean(res.hasMore));
      }
    } catch (e) {
      console.warn("load more search results error", e);
    } finally {
      setLoadingMoreResults(false);
    }
  };

  // ---------- infinite scroll: fetch next page when the sentinel enters view ----------
  useEffect(() => {
    if (!openSearch || query.trim().length === 0) return;
    const sentinel = searchSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreResults();
      },
      { root: searchResultsContainerRef.current, rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSearch, query, results, hasMoreResults]);

  // ---------- detect newly awarded coupons and animate once per coupon code ----------
  useEffect(() => {
    if (!cartId) return;
    const currentCodes = new Set((cartCoupons || []).map((c) => c.code));
    const newCodes = [];
    for (const code of currentCodes) {
      if (!seenCouponCodesRef.current.has(code)) {
        newCodes.push(code);
        seenCouponCodesRef.current.add(code);
      }
    }
    if (newCodes.length > 0) {
      triggerOfferPoppers();

      // quick console notification for now (replace with your toast)
      newCodes.forEach((c) => console.log("New coupon awarded:", c));
    }
  }, [cartCoupons, cartId]);

  useEffect(() => {
    if (!cartId) return;

    if (hasReachedGiftMilestone && !hasReachedGiftMilestoneRef.current) {
      triggerOfferPoppers();
    }

    hasReachedGiftMilestoneRef.current = hasReachedGiftMilestone;
  }, [cartId, hasReachedGiftMilestone]);

  // ---------- wrappers to handle immediate awarded coupons returned by API ----------
  const handleAddToCart = async (product) => {
    try {
      // storeAddToCart should ideally return response with `awarded` array (see server design).
      const res = await storeAddToCart(product.id, {
        name: product.name,
        image: product.image,
        originalPrice: product.originalPrice,
        discountedPrice: product.discountedPrice,
      });
      // if storeAddToCart returns awarded coupons directly:
      if (res && res.awarded && res.awarded.length > 0) {
        // mark seen so effect won't double-animate
        res.awarded.forEach((code) => seenCouponCodesRef.current.add(code));
        // popper animate
        triggerOfferPoppers();
        // also refresh full cart state
        await fetchCart();
        return;
      }
      // otherwise simply refresh cart to pick up awarded coupons
      await fetchCart();
    } catch (e) {
      console.error("addToCart error", e);
      // still refresh
      try { await fetchCart(); } catch (refreshError) { console.warn("fetchCart after add failed", refreshError); }
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    try {
      const res = await updateQuantityStore(cartItemId, newQty);
      // if updateQuantityStore returns awarded:
      if (res && res.awarded && res.awarded.length > 0) {
        res.awarded.forEach((code) => seenCouponCodesRef.current.add(code));
        triggerOfferPoppers();
      }
      await fetchCart();
    } catch (e) {
      console.error("update quantity error", e);
      try { await fetchCart(); } catch (refreshError) { console.warn("fetchCart after quantity update failed", refreshError); }
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    try {
      await removeFromCartStore(cartItemId);
      await fetchCart();
    } catch (e) {
      console.error("remove from cart error", e);
    }
  };

  // apply coupon wrapper
  const handleApplyCoupon = async (code) => {
    try {
      const res = await applyCouponStore(code); // expects { success, ... }
      // applyCouponStore should call server and then update cart state (or return result)
      if (res && res.success) {
        // ensure newly applied codes are seen
        if (res.applied?.code) seenCouponCodesRef.current.add(res.applied.code);
        // trigger small animation
        triggerOfferPoppers();
        // refresh full cart state
        await fetchCart();
        setShowCoupons(false);
      } else {
        // server returned error
        const message = res?.message || "Unable to apply coupon";
        console.warn(message);
      }
    } catch (e) {
      console.error("apply coupon error", e);
    }
  };

  // inside Navbar component **after** hooks and before return()
  const handleRemoveCoupon = async (cartCouponId: number) => {
    try {
      const res = await removeCartCoupon(cartCouponId);

      if (!res?.success) {
        console.warn("remove coupon failed", res);
      }

    } catch (err) {
      console.error("Remove coupon error:", err);
    }
  };


  // ---------- handlers for UI open/close ----------
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
  const handleUserClick = () => {
    const isLoggedIn = Boolean(localStorage.getItem("token"));
    if (isLoggedIn) navigate("/profile");
    else navigate("/signin");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
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
                  <h2 className="text-2xl font-bold mb-2">NoshBOB</h2>

                  {finalMenu.map((item) =>
                    item.hasSubmenu ? (
                      <div key={item.label} className="border-b border-accent-foreground/20 pb-2">
                        <button
                          onClick={() => setSubmenuOpen((prev) => !prev)}
                          className="w-full flex justify-between items-center text-lg font-medium hover:text-secondary transition-colors py-2"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon size={18} />
                            {item.label}
                          </div>

                          {submenuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
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
                        className="flex items-center gap-2 text-lg font-medium hover:text-secondary transition-colors py-2 border-b border-accent-foreground/20"
                        onClick={() => setOpen(false)}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </a>
                    )
                  )}

                </div>
              </SheetContent>
            </Sheet>

            {/* Center: Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {assetsSettled ? (
                <a href="/" className="block">
                  <img
                      src={logoImage}
                      alt="Logo"
                      className="h-20 w-auto object-contain drop-shadow-md"
                      loading="eager"
                    />
                </a>
              ) : (
                <Skeleton className="h-20 w-28 rounded-md bg-primary-foreground/20" />
              )}
            </div>

            {/* Right: Icons */}
            <div className="flex items-center gap-0.2 sm:gap-2">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80" onClick={handleOpenSearch}>
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleUserClick} className="text-primary-foreground hover:bg-primary/80">
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

                <SheetContent side="right" className="w-full max-w-[28rem] sm:max-w-[28rem] bg-background text-foreground flex flex-col h-full shadow-2xl !p-0 [&>button.absolute]:hidden">
                  {cartCount === 0 ? (
                    // ---------- EMPTY CART VIEW ----------
                    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
                      <img
                        src="/images/cart/empty-cart.avif"
                        alt="Empty Cart"
                      // className="w-48 h-48 mb-4 opacity-90"
                      />

                      <Button
                        className="bg-primary text-white px-6 py-3 rounded-full font-semibold"
                        onClick={() => {
                          setOpenCart(false);
                          navigate("/");
                        }}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  ) : (
                    // ---------- CART UI ----------
                    <div className="relative flex h-full flex-col overflow-hidden">
                      <canvas
                        ref={offerConfettiCanvasRef}
                        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                        aria-hidden
                      />

                      {/* header */}
                      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          <ShoppingCart className="h-5 w-5" /> Your Cart
                        </h2>
                        <button onClick={() => setOpenCart(false)} className="text-muted-foreground hover:text-foreground transition">
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* content */}
                      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3">
                        {/* 📍 Delivery address */}
                        <CartAddressSelector />

                        {/* 🎁 Free Gift / progress + poppers */}
                        <div className="bg-secondary/10 rounded-xl p-3 mb-4 relative overflow-hidden">
                          <p className="text-center text-xs font-semibold text-green-700">
                            {hasReachedGiftMilestone ? <span>You have reached a offer milestone 🎉</span> : <span>Get a free gift by adding items worth ₹{FREE_GIFT_THRESHOLD}</span>}
                          </p>

                          <div className="relative mt-2">
                            <div className="w-full bg-secondary/20 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-secondary h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.round((cartTotalBeforeDiscount / FREE_GIFT_THRESHOLD) * 100))}%` }}
                              />
                            </div>

                            <div
                              className="absolute top-[-9px] bg-white border border-secondary rounded-full w-7 h-7 flex items-center justify-center text-secondary text-xs font-bold shadow transition-transform"
                              style={{
                                right: `${Math.max(0, 100 - Math.min(100, Math.round((cartTotalBeforeDiscount / FREE_GIFT_THRESHOLD) * 100)))}%`,
                                transform: `translateX(${Math.min(0, Math.round((cartTotalBeforeDiscount / FREE_GIFT_THRESHOLD) * 100) - 100)}%)`,
                              }}
                              aria-hidden
                            >
                              🎁
                            </div>

                            <p className="text-xs text-right mt-1.5 text-green-700 font-medium">₹{FREE_GIFT_THRESHOLD} Free Gift</p>
                          </div>
                        </div>

                        {/* cart items */}
                        <div className="space-y-2.5">
                          {cart.map((item) => (
                            <div className="flex gap-2.5 border rounded-lg p-2.5" key={item.cartItemId}>
                              <img src={item.image} className="w-14 h-14 shrink-0 rounded-md object-cover" alt={item.name} />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold line-clamp-1">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-muted-foreground line-through text-xs">₹{item.originalPrice}</p>
                                  <p className="text-sm font-bold">₹{item.discountedPrice}</p>
                                </div>

                                <div className="flex justify-between items-center mt-1.5">
                                  <div className="flex items-center gap-2 border rounded-full px-1.5 py-0.5">
                                    <button
                                      onClick={() => handleUpdateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                                      className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
                                    <button
                                      onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                                      className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleRemoveFromCart(item.cartItemId)}
                                    className="p-1 text-muted-foreground hover:text-destructive"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* coupons panel */}
                        <div className="mt-4 border border-border/40 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm">Coupons</h4>
                            {!showCoupons ? (
                              <div className="flex items-center gap-3">
                                <button onClick={() => setShowCoupons(true)} className="flex items-center gap-2 text-sm bg-primary/5 px-3 py-1 rounded-md hover:bg-primary/10">
                                  View coupons <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setShowCoupons(false)} className="p-1 rounded-md hover:bg-border/40" aria-label="Back">
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {showCoupons ? (
                            <div className="space-y-4">
                              {(cartCoupons || []).length > 0 && (
                                <div className="mb-4">
                                  <h5 className="text-sm font-semibold">Applied Coupons</h5>
                                  <div className="space-y-2 mt-2">
                                    {cartCoupons.map((cc) => (
                                      <div key={cc.id} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <strong className="text-sm">{cc.code}</strong>
                                            <span className="text-xs text-muted-foreground">{cc.title}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground">min order ₹{cc.min_order}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs px-2 py-0.5 rounded ${cc.is_applied ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                            {cc.is_applied ? "Applied" : "Not applied"}
                                          </span>
                                          <button
                                            className="text-xs text-destructive hover:underline"
                                            onClick={async () => {
                                              await handleRemoveCoupon(cc.id);
                                              // store will refetch; if not, call fetchCart()
                                              // await fetchCart();
                                            }}
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* available coupons — ignore auto_award ones if you don't want to surface them here */}
                              {(availableCoupons || []).filter((c) => c.available).map((c) => (
                                <div key={c.code} className="bg-white border rounded-lg p-4 flex justify-between items-start gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-7 h-7 rounded-full border flex items-center justify-center text-primary">%</div>
                                      <strong className="text-sm">{c.code}</strong>
                                    </div>
                                    <div className="text-sm font-semibold">{c.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1">on orders above ₹{c.min_order}</div>
                                    {c.value && <div className="text-xs text-green-700 mt-2">{c.discount_type === "flat" ? `Save ₹${c.value}` : `${c.value}% off`}</div>}
                                  </div>

                                  <div>
                                    <button
                                      className="bg-[#7fc3ba] text-white px-4 py-2 rounded-lg font-semibold"
                                      onClick={() => handleApplyCoupon(c.code)}
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {/* unavailable */}
                              <div>
                                <h5 className="text-xs font-semibold text-muted-foreground mb-2">UNAVAILABLE COUPONS</h5>
                                {(availableCoupons || []).filter((c) => !c.available && !c.alreadyApplied).map((c) => (
                                  <div key={c.code} className="bg-white border rounded-lg p-4 mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-7 h-7 rounded-full border flex items-center justify-center text-muted-foreground">%</div>
                                      <strong className="text-sm text-muted-foreground">{c.code}</strong>
                                    </div>
                                    <div className="text-sm font-semibold">{c.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1">on orders above ₹{c.min_order}</div>
                                    <div className="text-xs text-red-600 mt-2">Add ₹{Math.max(0, c.min_order - cartTotalBeforeDiscount)} more to avail this offer</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // compact view when panel closed: show applied coupon summary first;

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm flex items-center justify-between">
                              <div>
                                {/*
                                    1) Prefer coupons actually applied to cart (is_applied = true).
                                    2) If none applied, show the first eligible, non-auto-award coupon as a suggestion.
                                    3) Otherwise show fallback text.
                                  */}
                                {Array.isArray(cartCoupons) && cartCoupons.filter(cc => cc.is_applied).length > 0 ? (
                                  // show the first applied coupon summary (if multiple applied you could change text accordingly)
                                  (() => {
                                    const applied = cartCoupons.filter(cc => cc.is_applied);
                                    const first = applied[0];
                                    return (
                                      <div className="font-semibold flex items-center gap-1">
                                        <Check className="w-4 h-4 text-green-600" />
                                        <strong>{first.code}</strong>
                                        <span className="font-normal">— {first.title}</span>

                                        {applied.length > 1 && (
                                          <span className="text-xs text-muted-foreground ml-1">
                                            (+{applied.length - 1} more)
                                          </span>
                                        )}
                                      </div>

                                    );
                                  })()
                                ) : (
                                  // no applied coupon: show best eligible non-auto-award coupon (ignore auto_award in compact hint)
                                  (() => {
                                    const nonAutoEligible = (availableCoupons || [])
                                      .filter(c => !c.auto_award && c.available)
                                      // optional: prefer lowest min_order or highest savings — adjust sort as you like
                                      .sort((a, b) => (a.min_order - b.min_order));
                                    if (nonAutoEligible.length > 0) {
                                      const hint = nonAutoEligible[0];
                                      const savingsText = hint.value
                                        ? (hint.discount_type === "flat" ? `₹${hint.value} off` : `${hint.value}% off`)
                                        : "";
                                      return (
                                        <div className="font-semibold">
                                          {savingsText ? `${savingsText} with ` : ""}<strong>{hint.code}</strong> — <span className="font-normal">{hint.title}</span>
                                        </div>
                                      );
                                    }
                                    // fallback message
                                    return <div className="font-semibold">No coupons available yet</div>;
                                  })()
                                )}

                                <div className="text-xs text-muted-foreground">Tap "View coupons" to see more</div>
                              </div>

                              <button onClick={() => setShowCoupons(true)} className="text-xs text-green-700 font-semibold hover:underline">
                                View
                              </button>
                            </div>

                          )}

                        </div>

                        {/* special offers */}
                        <div className="mt-4 mb-3">
                          <h4 className="font-semibold text-sm mb-2">YOU MAY ALSO LIKE</h4>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {recommended.map((item, index) => (
                              <div key={index} className="min-w-[120px] border border-border/50 rounded-lg p-2 relative">
                                <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold rounded px-1.5 py-0.5">10% OFF</div>
                                <img src={item.image} alt={item.name} className="w-full h-24 object-cover rounded-md mb-1" />
                                <p className="text-xs font-semibold line-clamp-2">{item.name}</p>
                                <Button size="sm" className="w-full mt-2" onClick={() => handleAddToCart(item)}>Add</Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* checkout footer */}
                      <div className="sticky bottom-0 border-t border-border bg-background px-4 py-3 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">

                        {/* SUMMARY */}
                        <div className="space-y-1.5 text-sm">

                          {/* Subtotal */}
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>{fmt(cartTotalBeforeDiscount)}</span>
                          </div>

                          {/* Discount applied */}
                          {cartTotalBeforeDiscount > cartTotal && (
                            <div className="flex justify-between text-red-600 font-medium">
                              <span>Discount</span>
                              <span>-{fmt(cartTotalBeforeDiscount - cartTotal)}</span>
                            </div>
                          )}

                          {/* Final total */}
                          <div className="flex justify-between font-semibold text-base pt-2 border-t">
                            <span>Estimated Total</span>
                            <span>{fmt(cartTotal)}</span>
                          </div>
                        </div>

                        {/* CHECKOUT BUTTON */}
                        <Button
                          className="mt-3 w-full bg-primary text-white hover:bg-primary/90 rounded-full font-bold py-3"
                          onClick={handleCheckout}
                        >
                          Checkout
                        </Button>

                        {/* Razorpay footer */}
                        <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                          🔒 Secured by
                          <img
                            src="/images/logo/razorpay-icon.svg"
                            alt="Razorpay"
                            className="h-3 w-auto inline-block"
                          />
                        </p>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Search overlay */}
      {openSearch && (
        <div className="fixed top-0 left-0 w-full bg-background shadow-md border-b border-border z-[60] animate-fadeIn">
          <div className="container mx-auto px-4 py-6">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="icon" onClick={() => setOpenSearch(false)}><X className="h-5 w-5" /></Button>
            </div>

            <div className="flex justify-center">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search products..." className="w-[90%] md:w-[60%] border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <h3 className="mt-8 mb-6 text-center font-semibold text-base md:text-md text-muted-foreground uppercase tracking-wide">
              {query.length > 0 ? "Search Results" : "Or Select From Our Recommended Products"}
            </h3>

            <div ref={searchResultsContainerRef} className="max-h-[50vh] overflow-y-auto pb-6 text-center">
              {searching && <p className="text-sm text-muted-foreground">Searching...</p>}

              {query.length > 0 && !searching && results.length > 0 && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
                    {results.map((product) => (
                      <ProductCardMini key={product.id} id={product.id} image={resolveProductImage(product)} name={product.name} rating={product.rating} reviews={product.reviews} originalPrice={product.originalPrice} discountedPrice={product.discountedPrice} />
                    ))}
                  </div>

                  {/* infinite-scroll trigger + loading state */}
                  <div ref={searchSentinelRef} className="h-1" />
                  {loadingMoreResults && (
                    <p className="mt-6 text-sm text-muted-foreground">Loading more...</p>
                  )}
                </>
              )}

              {query.length > 0 && !searching && results.length === 0 && <p className="text-sm text-muted-foreground">No products found.</p>}

              {query.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
                  {recommended.map((product) => (
                    <ProductCardMini key={product.id} id={product.id} image={resolveProductImage(product)} name={product.name} rating={product.rating} reviews={product.reviews} originalPrice={product.originalPrice} discountedPrice={product.discountedPrice} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center">

            <div className="w-56 mx-auto mb-6">
              <Lottie
                animationData={orderSuccessAnim}
                loop={false}
                onComplete={() => {
                  setOrderSuccess(false);
                  navigate("/orders");
                }}
              />
            </div>

            <h2 className="text-2xl font-bold text-green-700">
              Payment Successful 🎉
            </h2>

            <p className="text-muted-foreground mt-2">
              Your order is on the way!
            </p>

            <p className="mt-3 text-xs text-gray-400">
              Redirecting you to orders...
            </p>
          </div>
        </div>
      )}

    </>

  );
};

export default Navbar;
