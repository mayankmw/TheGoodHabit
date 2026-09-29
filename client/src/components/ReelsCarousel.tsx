import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Instagram, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { productPath } from "@/lib/productUrl";
import { useCommonStore, type ReelItem } from "@/store/useCommonStore";

type ReelProduct = ReelItem["product"];

const COVER_CLASS = "group relative block aspect-[9/16] w-full overflow-hidden bg-black";

const Price = ({ product, className }: { product: ReelProduct; className?: string }) => {
  const off =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className={cn("flex items-baseline gap-2 text-sm", className)}>
      <span className="font-bold">₹{product.price}</span>
      {off > 0 && (
        <>
          <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
          <span className="text-xs font-semibold text-green-600">{off}% Off</span>
        </>
      )}
    </div>
  );
};

const BuyButton = ({
  product,
  className,
  onNavigate,
}: {
  product: ReelProduct;
  className?: string;
  onNavigate?: () => void;
}) => (
  <Button
    asChild
    variant={product.inStock ? "default" : "outline"}
    className={cn(
      "font-bold text-xs",
      product.inStock && "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
      className
    )}
  >
    <Link to={productPath(product)} onClick={onNavigate}>
      {product.inStock ? "Buy Now" : "Sold out"}
    </Link>
  </Button>
);

const ReelCover = ({ reel }: { reel: ReelItem }) => (
  <>
    {reel.thumbnailUrl && (
      <img
        src={reel.thumbnailUrl}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    )}
    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 transition-colors group-hover:bg-black/25">
      <span className="rounded-full bg-white/90 p-3 text-primary shadow-lg">
        {reel.videoUrl ? <Play className="h-5 w-5 fill-current" /> : <Instagram className="h-5 w-5" />}
      </span>
      {!reel.videoUrl && (
        <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white">
          Watch on Instagram
        </span>
      )}
    </span>
  </>
);

export const ReelsCarousel = () => {
  const { reels, fetchReels } = useCommonStore();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [playing, setPlaying] = useState<ReelItem | null>(null);

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

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

  // nothing to show, or Instagram isn't connected: leave the section out
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
              aria-label="Previous reels"
              className="rounded-full bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label="Next reels"
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
              <div key={reel.id} className="flex-[0_0_62%] sm:flex-[0_0_38%] md:flex-[0_0_28%] lg:flex-[0_0_19%]">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
                  {reel.videoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPlaying(reel)}
                      aria-label={`Play the reel for ${reel.product.name}`}
                      className={COVER_CLASS}
                    >
                      <ReelCover reel={reel} />
                    </button>
                  ) : (
                    // licensed music: Instagram only lets these play on Instagram
                    <a
                      href={reel.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Watch the reel for ${reel.product.name} on Instagram (opens in a new tab)`}
                      className={COVER_CLASS}
                    >
                      <ReelCover reel={reel} />
                    </a>
                  )}

                  <div className="flex flex-1 flex-col p-3 text-center">
                    <h3 className="text-sm font-semibold line-clamp-2">{reel.product.name}</h3>
                    <Price product={reel.product} className="mt-1 justify-center" />
                    <div className="mt-auto pt-3">
                      <BuyButton product={reel.product} className="w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PLAYER ================= */}
      <Dialog open={Boolean(playing)} onOpenChange={(open) => !open && setPlaying(null)}>
        {/* grid-cols-1: DialogContent is a grid, and its default auto column
            widens to fit a long product name, pushing the video and the Buy
            button past the dialog's edge. The [&>button] styles are for the
            built-in close button, which is near invisible over light footage. */}
        <DialogContent className="max-w-[400px] grid-cols-1 gap-0 overflow-hidden p-0 [&>button]:rounded-full [&>button]:bg-black/50 [&>button]:p-1.5 [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-black/70">
          {playing && (
            <>
              <DialogTitle className="sr-only">Reel: {playing.product.name}</DialogTitle>

              <div className="h-[68vh] max-h-[700px] w-full bg-black">
                <video
                  key={playing.id}
                  src={playing.videoUrl ?? undefined}
                  poster={playing.thumbnailUrl ?? undefined}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex items-center gap-3 p-4">
                {playing.product.image && (
                  <img
                    src={playing.product.image}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-semibold leading-snug">{playing.product.name}</p>
                  <Price product={playing.product} />
                </div>
                <BuyButton product={playing.product} onNavigate={() => setPlaying(null)} />
              </div>

              <a
                href={playing.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border-t py-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Instagram className="h-3.5 w-3.5" />
                Watch on Instagram
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
