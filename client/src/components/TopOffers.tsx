import { useState, useEffect, useRef } from "react";

const offers = [
  "🎉 Get 10% OFF on your first order — Use code WELCOME10",
  "🚚 Free Shipping on orders above ₹999!",
  "🌿 Try our new Kunafa Protein Dates — Limited Edition!",
  "💪 Subscribe & Save 15% on monthly deliveries!",
];

export const TopOffers = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const containerRef = useRef(null);

  const slides = [...offers, offers[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => prev + 1);
      setIsTransitioning(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (current === offers.length) {
      setTimeout(() => {
        setIsTransitioning(false); 
        setCurrent(0);
      }, 700);
    }
  }, [current]);

  return (
    <div className="bg-foreground text-background py-2 overflow-hidden relative">
      <div
        ref={containerRef}
        className={`flex ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
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
