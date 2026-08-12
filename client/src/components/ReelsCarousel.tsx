import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCommonStore } from "@/store/useCommonStore";

export const ReelsCarousel = () => {
  const { reels, fetchReels, loadingReels } = useCommonStore();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeReel, setActiveReel] = useState<any>(null);

  /* ================= FETCH REELS ================= */
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

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

  if (loadingReels) {
    return (
      <section className="py-12 text-center text-muted-foreground">
        Loading reels...
      </section>
    );
  }

  if (!reels.length) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="heading-gradient font-display text-3xl md:text-4xl font-semibold tracking-wide">
            Mini Motions
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

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="flex-[0_0_85%] sm:flex-[0_0_38%] lg:flex-[0_0_18%]"
              >
                <div
                  onClick={() => setActiveReel(reel)}
                  className="cursor-pointer border rounded-xl overflow-hidden bg-card hover:scale-[1.03] transition"
                >
                  {/* Video */}
                  <div className="relative aspect-[3/5] bg-black">
                    <video
                      src={reel.video}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {reel.views} Views
                    </div>
                    <button className="absolute bottom-2 right-2 bg-black/70 text-white p-1.5 rounded-full">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-3 text-center">
                    <h3 className="text-sm font-semibold line-clamp-2">
                      {reel.product.name}
                    </h3>

                    <div className="mt-1 flex justify-center gap-2 text-sm">
                      <span className="font-bold">₹{reel.product.price}</span>

                      {reel.product.originalPrice && (
                        <span className="line-through text-xs text-muted-foreground">
                          ₹{reel.product.originalPrice}
                        </span>
                      )}

                      {reel.product.discount && (
                        <span className="text-xs text-green-600 font-semibold">
                          {reel.product.discount}
                        </span>
                      )}
                    </div>

                    <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs mt-3">
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= FULLSCREEN REEL ================= */}
      {activeReel && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-[380px] h-[85vh] rounded-2xl overflow-hidden bg-black">
            <button
              onClick={() => setActiveReel(null)}
              className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full z-50"
            >
              <X className="w-5 h-5" />
            </button>

            <video
              src={activeReel.activeVideo}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
              <h3 className="text-lg font-bold">
                {activeReel.product.name}
              </h3>

              <div className="mt-1 flex gap-2 text-sm">
                <span className="font-semibold">
                  ₹{activeReel.product.price}
                </span>
                {activeReel.product.originalPrice && (
                  <span className="line-through text-xs text-gray-400">
                    ₹{activeReel.product.originalPrice}
                  </span>
                )}
              </div>

              <Button className="w-full mt-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold">
                Buy Now
                </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
