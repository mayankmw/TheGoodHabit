import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";
import { IMAGES_CAROUSEL_FALLBACKS } from "@/lib/assetFallbacks";

export const ImagesCarousel = () => {
  const { assets } = useCommonStore();

  const imageByPosition = new Map(
    (assets?.imagesCarousel || []).map((a) => [a.position, a.image])
  );

  const images = IMAGES_CAROUSEL_FALLBACKS.map(
    (fallback, i) => imageByPosition.get(i + 1) || fallback
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="bg-background py-12">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 inline-block text-3xl md:text-4xl font-black uppercase bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
          We Fit in Every Moment
        </h2>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {images.map((src, i) => (
              <div
                key={i}
                className="flex-[0_0_75%] sm:flex-[0_0_45%] lg:flex-[0_0_23%]"
              >
                <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
                  <img
                    src={src}
                    alt={`NoshBOB lifestyle photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {canScrollPrev && (
            <button
              type="button"
              aria-label="Previous slide"
              onClick={scrollPrev}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selectedIndex ? "w-6 bg-primary" : "w-2 bg-primary/40"
                }`}
              />
            ))}
          </div>

          {canScrollNext && (
            <button
              type="button"
              aria-label="Next slide"
              onClick={scrollNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ImagesCarousel;
