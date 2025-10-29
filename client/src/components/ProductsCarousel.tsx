import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";

const products = [
  {
    id: 1,
    image: "/images/products/product1.webp",
    name: "ALL MINIS IN 1",
    price: 900,
    rating: 4.5,
    reviews: 2,
  },
  {
    id: 2,
    image: "/images/products/product2.webp",
    name: "CHEESE PROTEIN WAFER – PACK OF 10",
    price: 499,
    originalPrice: 550,
    discount: 9,
    rating: 4.5,
    reviews: 118,
  },
  {
    id: 3,
    image: "/images/products/product3.webp",
    name: "CHOCO HAZELNUT + COOKIES & CREAM",
    price: 600,
    rating: 5,
    reviews: 5,
  },
  {
    id: 4,
    image: "/images/products/product4.webp",
    name: "CHOCO PEANUT BUTTER PROTEIN WAFER – PACK OF 10",
    price: 499,
    originalPrice: 550,
    discount: 9,
    rating: 4.5,
    reviews: 104,
  },
  {
    id: 5,
    image: "/images/products/product5.webp",
    name: "PROTEIN POWER BARS",
    price: 450,
    rating: 4.5,
    reviews: 89,
  },
  {
    id: 6,
    image: "/images/products/product1.webp",
    name: "SUPER GREENS BLEND",
    price: 799,
    originalPrice: 899,
    discount: 11,
    rating: 5,
    reviews: 156,
  },
];

export const ProductsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 4 },
    },
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
          <h2 className="text-3xl md:text-4xl font-black uppercase bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
            Our Products
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="rounded-full border-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="rounded-full border-2 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(25%-18px)]"
              >
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
