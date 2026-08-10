import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { FrequentlyBoughtTogether } from "@/components/FrequentlyBoughtTogether";
import { useProductStore } from "@/store/useProductStore";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { useCommonStore } from "@/store/useCommonStore";
import HeroImage from "@/components/HeroImage";
import { HERO_FALLBACKS } from "@/lib/assetFallbacks";

export const Product = () => {
  const { id } = useParams();

  const {
    product,
    fetchSingleProduct,
    fetchFrequentlyBought,
    frequentlyBought,
    loading,
    loadingFrequentlyBought,
  } = useProductStore();
  const addToCart = useCartStore((s) => s.addToCart);
  const setOpenCart = useUIStore((s) => s.setOpenCart);
  const setOpenSearch = useUIStore((s) => s.setOpenSearch);
  const [selectedImage, setSelectedImage] = useState("");

  const { assets } = useCommonStore();

  const hero3Image = assets?.hero?.find(h => h.position === 3)?.image || HERO_FALLBACKS[2];

  useEffect(() => {
    if (!id) return;
    fetchSingleProduct(id);
    fetchFrequentlyBought(id);
  }, [id, fetchSingleProduct, fetchFrequentlyBought]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const parseImageSource = (source: unknown): string[] => {
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
          return [];
        }
      }

      return [];
    };

    const images = new Set<string>();
    if (product.image) images.add(product.image);

    const maybeGallery = product as unknown as {
      images?: unknown;
      gallery?: unknown;
      additionalImages?: unknown;
    };

    [maybeGallery.images, maybeGallery.gallery, maybeGallery.additionalImages]
      .forEach((source) => {
        parseImageSource(source).forEach((image) => images.add(image));
      });

    return Array.from(images);
  }, [product]);

  useEffect(() => {
    if (galleryImages.length) {
      setSelectedImage(galleryImages[0]);
    }
  }, [galleryImages]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl opacity-70">
        Loading product...
      </div>
    );
  }

  // const isDatesProduct = product.type === "dates";
  const isDatesProduct = true;

  const discountPercent = Math.round(
    ((product.originalPrice - product.discountedPrice) / product.originalPrice) * 100
  );

  return (
    <section className="bg-gradient-to-b from-amber-50 via-white to-amber-100 text-foreground min-h-screen py-10 relative overflow-hidden">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Product Image */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full rounded-2xl border bg-white p-3 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-50">
              <img
                src={selectedImage || product.image}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {galleryImages.map((image, index) => {
                const isActive = image === selectedImage;
                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`overflow-hidden rounded-lg border bg-white p-1 transition ${
                      isActive
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-md bg-slate-50">
                      <img
                        src={image}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase text-primary">
            {product.name}
          </h1>

          {/* Ratings */}
          <div className="flex items-center gap-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-zinc-500"
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
          </div>

          {/* Description */}
          <motion.p
            className="text-muted-foreground leading-relaxed text-sm md:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {product.description}
          </motion.p>

          {/* Storytelling for dates */}
          {isDatesProduct && (
            <div className="space-y-4 mt-8">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <motion.img
                  src="/images/elements/dates.png"
                  className="w-20 h-20"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs shadow">
                  “We’ve traveled from the warm palms of nature...”
                </div>
              </motion.div>

              <motion.div
                className="flex items-center justify-end gap-3 text-right"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
              >
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs shadow">
                  “Soaked in sunshine, filled with natural sweetness...”
                </div>
                <motion.img
                  src="/images/elements/dates.png"
                  className="w-20 h-20"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                />
              </motion.div>

              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 2.8 }}
              >
                <motion.img
                  src="/images/elements/dates.png"
                  className="w-20 h-20"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs shadow">
                  “We’re your humble dates — your energy partners!”
                </div>
              </motion.div>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">₹{product.discountedPrice}</span>
                <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                <span className="text-sm font-semibold text-green-600">
                  ({discountPercent}% OFF)
                </span>
              </div>
            </div>

            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/80 px-6 py-3 rounded-full font-semibold transition"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product.id, {
                  name: product.name,
                  image: product.image,
                  originalPrice: product.originalPrice,
                  discountedPrice: product.discountedPrice,
                });
                setOpenSearch(false);
                setOpenCart(true);
              }}
            >
              Add to Cart
            </Button>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-semibold mt-6 mb-2">Ingredients</h3>

            <div className="flex flex-wrap gap-2">
              {(Array.isArray(product.ingredients)
                ? product.ingredients
                : JSON.parse(product.ingredients || "[]")
              ).map((item, i) => (
                <motion.span
                  key={i}
                  className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {item}
                </motion.span>
              ))}
            </div>
          </div>

        </motion.div>
      </div>

      <FrequentlyBoughtTogether
        currentProduct={{
          id: product.id,
          name: product.name,
          image: galleryImages[0] || product.image,
          originalPrice: product.originalPrice,
          discountedPrice: product.discountedPrice,
        }}
        products={frequentlyBought}
        loading={loadingFrequentlyBought}
      />

      {/* ✅ Hero 3 (Product Page Banner) */}
      <div>
        <HeroImage
          src={hero3Image}
          alt="Product Page Hero Image"
        />
      </div>
    </section>
  );
};

export default Product;
