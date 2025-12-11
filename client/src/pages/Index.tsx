import { BannerSlider } from "@/components/BannerSlider";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { ReelsCarousel } from "@/components/ReelsCarousel";
import HeroImage from "@/components/HeroImage";

const Index = () => {
  return (
    <main>
      <BannerSlider />
      <ProductsCarousel />
      <HeroImage
        src="/images/hero/hero-image.png"
        alt="Hero Image"
      />
      <ReelsCarousel />
    </main>
  );
};

export default Index;
