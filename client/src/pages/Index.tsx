import { BannerSlider } from "@/components/BannerSlider";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { ReelsCarousel } from "@/components/ReelsCarousel";
import HeroImage from "@/components/HeroImage";
import { useCommonStore } from "@/store/useCommonStore";

const Index = () => {
  const { assets } = useCommonStore();

  const hero1 = assets?.hero?.find(h => h.position === 1);
  const hero2 = assets?.hero?.find(h => h.position === 2);

  return (
    <main>
      <BannerSlider banners={assets?.banner || []} />

      <ProductsCarousel />

      {hero1?.image && (
        <HeroImage
          src={hero1.image}
          alt="Hero Image 1"
        />
      )}

      <ReelsCarousel />

      {hero2?.image && (
        <HeroImage
          src={hero2.image}
          alt="Hero Image 2"
        />
      )}
    </main>
  );
};

export default Index;
