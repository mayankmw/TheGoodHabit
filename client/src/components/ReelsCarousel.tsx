import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const reels = [
  {
    id: 1,
    video: "https://cdn.shopify.com/videos/c/o/v/78be73064b374128b4ac0d1116997573.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/5215cf81d0684b0286cf05a87740fb0e.mp4",
    views: "675",
    name: "Choco Hazelnut + Cookies & Cream",
    price: 600,
  },
  {
    id: 2,
    video: "https://cdn.shopify.com/videos/c/o/v/5dadfb47b98d44d79b6133ae197c3bf6.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/32c5b385cb344af6921dc7cc0760ce33.mp4",
    views: "10.4K",
    name: "Cold Coffee 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },
  {
    id: 3,
    video: "https://cdn.shopify.com/videos/c/o/v/5dd672b91fe34099bd83196e905c3105.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/2c10b35d886344559efd6232eb536fa7.mp4",
    views: "855",
    name: "Assorted Minis - Pack of 30",
    price: 900,
  },
  {
    id: 4,
    video: "https://cdn.shopify.com/videos/c/o/v/88b991180e0845f9889d8ba87f616521.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/6de472f6e2c34300a67ade2c22e620f9.mp4",
    views: "162",
    name: "Chocolate 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },
    {
    id: 5,
    video: "https://cdn.shopify.com/videos/c/o/v/4411b29891de45b38cd5c83ab571e33e.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/6fdc370b25a847e8a15117e7366f7697.mp4",
    views: "675",
    name: "Choco Hazelnut + Cookies & Cream",
    price: 600,
  },
  {
    id: 6,
    video: "https://cdn.shopify.com/videos/c/o/v/e69587211a1c4a13ac62418f6be83ea3.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/626b33ae112f4d619bd89eeace4448e5.mp4",
    views: "10.4K",
    name: "Cold Coffee 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },
  {
    id: 7,
    video: "https://cdn.shopify.com/videos/c/o/v/dc260ad35494498abbf1e406aab4cd94.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/811589aa910440178f064d2479dbf761.mp4",    
    views: "855",
    name: "Assorted Minis - Pack of 30",
    price: 900,
  },
  {
    id: 8,
    video: "https://cdn.shopify.com/videos/c/o/v/a89b425e6c274d9cae5a9b7480b38c37.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/e47dcd1121404ddbb510a0df3685e93c.mp4",    
    views: "162",
    name: "Chocolate 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },
    {
    id: 9,
    video: "https://cdn.shopify.com/videos/c/o/v/0ac479588eed40b9ae1e3a2784fc1e1a.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/58795a6a297447148b895ad86370b0eb.mp4",    
    views: "675",
    name: "Choco Hazelnut + Cookies & Cream",
    price: 600,
  },
  {
    id: 10,
    video: "https://video.gumlet.io/64661d8e673536e1fe9044e2/67443f4c080b60408c8f1bfd/main.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/78be73064b374128b4ac0d1116997573.mp4",    
    views: "10.4K",
    name: "Cold Coffee 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },
  {
    id: 11,
    video: "https://video.gumlet.io/64661d8e673536e1fe9044e2/67347450ba34cfe064c6243a/main.mp4",
    activeVideo: "https://video.gumlet.io/64661d8e673536e1fe9044e2/6734744c3e1bc8b4e00e0010/main.mp4",    
    views: "855",
    name: "Assorted Minis - Pack of 30",
    price: 900,
  },
  {
    id: 12,
    video: "https://cdn.shopify.com/videos/c/o/v/5fb04401ac7448cc94475df39aaa360a.mp4",
    activeVideo: "https://cdn.shopify.com/videos/c/o/v/b53d3a4c9457459eb90b93b55f901858.mp4",    
    views: "162",
    name: "Chocolate 1 Kg - Fermented Protein",
    price: 2699,
    originalPrice: 2899,
    discount: "7% Off",
  },  
];

export const ReelsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [activeReel, setActiveReel] = useState(null); // <-- for modal

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
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl md:text-4xl font-black uppercase bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent tracking-wider">
            Mini Motions
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

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-5">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="flex-[0_0_85%] sm:flex-[0_0_38%] lg:flex-[0_0_18%] min-w-0"
              >
                <div
                  onClick={() => setActiveReel(reel)}
                  className="cursor-pointer border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-lg hover:scale-[1.03] transition-transform duration-300"
                >
                  {/* Video */}
                  <div className="relative aspect-[3/5] max-h-[480px] bg-black">
                    <video
                      src={reel.video}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="none"
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
                    <h3 className="text-sm font-semibold line-clamp-2">{reel.name}</h3>
                    <div className="mt-1 flex flex-col items-center">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold">INR {reel.price}</span>
                        {reel.originalPrice && (
                          <span className="text-muted-foreground line-through text-xs">
                            INR {reel.originalPrice}
                          </span>
                        )}
                        {reel.discount && (
                          <span className="text-xs text-green-600 font-semibold">
                            {reel.discount}
                          </span>
                        )}
                      </div>
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

      {/* Fullscreen Modal */}
        {activeReel && (
        <div className="fixed inset-0 bg-black/70 backdrop-sm z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] h-[85vh] rounded-2xl overflow-hidden bg-black flex flex-col">
            {/* Close Button */}
            <button
                onClick={() => setActiveReel(null)}
                className="absolute top-3 right-3 bg-black/70 text-white p-2 rounded-full z-50"
            >
                <X className="w-5 h-5" />
            </button>

            {/* Video section */}
            <video
                src={activeReel.activeVideo}
                controls
                autoPlay
                className="w-full h-full object-cover"
            />

            {/* Bottom info gradient */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4 text-white">
                <h3 className="text-lg font-bold">{activeReel.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="font-semibold">₹{activeReel.price}</span>
                {activeReel.originalPrice && (
                    <span className="line-through text-gray-400 text-xs">
                    ₹{activeReel.originalPrice}
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

