import { useState, useEffect, useRef } from "react";
import { useCommonStore } from "@/store/useCommonStore";

export const TopOffers = () => {
  const offers = useCommonStore((s) => s.sliders.top);

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const slides =
    offers.length > 0 ? [...offers, offers[0]] : [];

  useEffect(() => {
    if (!offers.length) return;

    const interval = setInterval(() => {
      setCurrent((prev) => prev + 1);
      setIsTransitioning(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [offers.length]);

  useEffect(() => {
    if (!offers.length) return;

    if (current === offers.length) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrent(0);
        requestAnimationFrame(() =>
          setIsTransitioning(true)
        );
      }, 700);
    }
  }, [current, offers.length]);

  if (!offers.length) return null;

  return (
    <div className="bg-foreground text-background py-2 overflow-hidden relative">
      <div
        ref={containerRef}
        className={`flex ${
          isTransitioning
            ? "transition-transform duration-700 ease-in-out"
            : ""
        }`}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((offer, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full text-center text-sm md:text-base font-medium tracking-wide"
          >
            {offer}
          </div>
        ))}
      </div>
    </div>
  );
};
