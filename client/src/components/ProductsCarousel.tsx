import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { Link } from "react-router-dom";
import { useProductStore } from "@/store/useProductStore";

export const ProductsCarousel = () => {
  const { products, fetchProducts, loading } = useProductStore();

  const resolvePrimaryImage = (product: { image?: unknown; images?: unknown }) => {
    if (typeof product?.image === "string" && product.image.trim()) {
      return product.image;
    }

    const parseImages = (value: unknown): string[] => {
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
          return [];
        }
      }

      return [];
    };

    return parseImages(product?.images)[0] || "";
  };

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  // 👉 Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="heading-gradient font-display text-3xl md:text-4xl font-semibold tracking-wide">
            Our Products
          </h2>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Loading UI */}
        {loading && (
          <p className="text-center text-lg opacity-60">Loading products...</p>
        )}

        {/* No products */}
        {!loading && products.length === 0 && (
          <p className="text-center text-lg opacity-60">No products found.</p>
        )}

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(25%-18px)]"
              >
                  <ProductCard {...product} image={resolvePrimaryImage(product)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
