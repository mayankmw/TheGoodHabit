// import { useState, useCallback, useEffect } from "react";
// import useEmblaCarousel from "embla-carousel-react";
// import Autoplay from "embla-carousel-autoplay";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { Button } from "@/components/ui/button";

// const banners = [
//   {
//     id: 1,
//     title: "PLANT POWER",
//     subtitle: "SUPERCHARGED WITH SUPER GREENS",
//     bgColor: "bg-secondary",
//     textColor: "text-accent",
//   },
//   {
//     id: 2,
//     title: "PROTEIN BOOST",
//     subtitle: "FUEL YOUR FITNESS JOURNEY",
//     bgColor: "bg-accent",
//     textColor: "text-secondary",
//   },
// ];

// export const BannerSlider = () => {
//   const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
//     Autoplay({ delay: 5000, stopOnInteraction: false }),
//   ]);
//   const [selectedIndex, setSelectedIndex] = useState(0);

//   const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
//   const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

//   const onSelect = useCallback(() => {
//     if (!emblaApi) return;
//     setSelectedIndex(emblaApi.selectedScrollSnap());
//   }, [emblaApi]);

//   useEffect(() => {
//     if (!emblaApi) return;
//     onSelect();
//     emblaApi.on("select", onSelect);
//     return () => {
//       emblaApi.off("select", onSelect);
//     };
//   }, [emblaApi, onSelect]);

//   return (
//     <div className="relative">
//       <div className="overflow-hidden" ref={emblaRef}>
//         <div className="flex">
//           {banners.map((banner) => (
//             <div key={banner.id} className="flex-[0_0_100%] min-w-0">
//               <div className={`${banner.bgColor} py-20 px-8 md:px-16 relative overflow-hidden`}>
//                 <div className="container mx-auto">
//                   <div className="max-w-2xl">
//                     <p className="text-lg md:text-xl font-bold mb-2 tracking-wider">INTRODUCING</p>
//                     <h2 className={`text-5xl md:text-7xl font-black mb-4 ${banner.textColor} leading-tight`}>
//                       {banner.title}
//                     </h2>
//                     <p className="text-xl md:text-2xl font-bold text-success">
//                       {banner.subtitle}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Navigation Buttons */}
//       <Button
//         variant="ghost"
//         size="icon"
//         className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg"
//         onClick={scrollPrev}
//       >
//         <ChevronLeft className="h-6 w-6" />
//       </Button>
//       <Button
//         variant="ghost"
//         size="icon"
//         className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg"
//         onClick={scrollNext}
//       >
//         <ChevronRight className="h-6 w-6" />
//       </Button>

//       {/* Dots */}
//       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
//         {banners.map((_, index) => (
//           <button
//             key={index}
//             className={`w-2 h-2 rounded-full transition-all ${
//               index === selectedIndex ? "bg-foreground w-8" : "bg-foreground/30"
//             }`}
//             onClick={() => emblaApi?.scrollTo(index)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const banners = [
  {
    id: 1,
    image: "/images/banners/banner1.jpeg", // 🖼️ Your full-width banner image
  },
  {
    id: 2,
    image: "/images/banners/banner2.png", // 🖼️ Your full-width banner image
  },
  //   {
  //   id: 2,
  //   title: "PROTEIN BOOST",
  //   subtitle: "FUEL YOUR FITNESS JOURNEY",
  //   bgColor: "bg-accent",
  //   textColor: "text-secondary",
  // },
];

export const BannerSlider = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0">
                <img
                  src={banner.image}
                  alt={`Banner ${banner.id}`}
                  className="w-full h-[500px] md:h-[600px] object-cover"
                />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full shadow-lg"
        onClick={scrollNext}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex ? "bg-foreground w-8" : "bg-foreground/30"
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};
