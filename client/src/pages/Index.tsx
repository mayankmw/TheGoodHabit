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
        src="/images/hero/hero-image-1.jpeg"
        alt="Hero Image"
      />
      <ReelsCarousel />
      <HeroImage
        src="/images/hero/hero-image-2.png"
        alt="Hero Image"
      />
    </main>
  );
};

export default Index;
