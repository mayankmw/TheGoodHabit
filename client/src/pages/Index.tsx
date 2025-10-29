import { Navbar } from "@/components/Navbar";
import { BannerSlider } from "@/components/BannerSlider";
import { ProductsCarousel } from "@/components/ProductsCarousel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <BannerSlider />
        <ProductsCarousel />
        
        {/* Marquee Footer */}
          <div className="bg-foreground text-background py-4 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-lg font-bold">
              <span>🥗 EAT FRESH, LIVE STRONG</span>
              <span>💪 SMALL STEPS, BIG CHANGES</span>
              <span>🧘‍♀️ FIND YOUR BALANCE EVERY DAY</span>
              <span>🌿 HEALTH IS THE NEW WEALTH</span>
              <span>🏃‍♂️ MOVE MORE, STRESS LESS</span>
              <span>🧡 NOURISH YOUR BODY, CALM YOUR MIND</span>
            </div>
          </div>
      </main>
    </div>
  );
};

export default Index;
