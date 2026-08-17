import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface BannerItem {
  id?: number;
  image: string | null;
  position: number;
}

export const BannerSlider = ({
  banners = [],
  onSlideChange,
  framed = true,
  loading = false,
}: {
  banners: BannerItem[];
  onSlideChange?: (index: number) => void;
  /** Wrap in the padded, rounded "framed" presentation used on the public
   * site. Admin previews pass `false` to keep edge-to-edge sizing so their
   * own overlay controls stay aligned to the image. */
  framed?: boolean;
  /** Show a skeleton instead of banners/fallbacks while the real assets
   * are still being fetched. */
  loading?: boolean;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  if (loading) {
    const skeleton = <Skeleton className={`aspect-[21/9] w-full ${framed ? "rounded-3xl" : ""}`} />;
    return framed ? (
      <div className="container mx-auto px-4 pt-6">{skeleton}</div>
    ) : (
      skeleton
    );
  }

  if (!banners.length) return null;

  const slider = (
    <div className={`relative overflow-hidden ${framed ? "rounded-3xl shadow-soft" : ""}`}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <img
                src={banner.image}
                alt={`Banner ${index + 1}`}
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <button
        type="button"
        aria-label="Previous banner"
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft transition-colors hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        aria-label="Next banner"
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-foreground shadow-soft transition-colors hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            aria-label={`Go to banner ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex ? "bg-white w-8" : "bg-white/50 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );

  if (!framed) return slider;

  return <div className="container mx-auto px-4 pt-6">{slider}</div>;
};
