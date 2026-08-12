import { BannerSlider } from "@/components/BannerSlider";
import { ProductsCarousel } from "@/components/ProductsCarousel";
import { FaqSection } from "@/components/FaqSection";
import { ImagesCarousel } from "@/components/ImagesCarousel";
import { ReelsCarousel } from "@/components/ReelsCarousel";
import HeroImage from "@/components/HeroImage";
import { useCommonStore } from "@/store/useCommonStore";
import { BANNER_FALLBACKS, HERO_FALLBACKS } from "@/lib/assetFallbacks";
import { Reveal } from "@/components/Reveal";

const Index = () => {
  const { assets } = useCommonStore();

  const hero1Image = assets?.hero?.find(h => h.position === 1)?.image || HERO_FALLBACKS[0];
  const hero2Image = assets?.hero?.find(h => h.position === 2)?.image || HERO_FALLBACKS[1];

  const bannerByPosition = new Map((assets?.banner || []).map(b => [b.position, b.image]));
  const banners = BANNER_FALLBACKS.map((fallback, i) => ({
    id: i,
    position: i + 1,
    image: bannerByPosition.get(i + 1) || fallback,
  }));

  return (
    <div>
      <BannerSlider banners={banners} />

      <Reveal>
        <ProductsCarousel />
      </Reveal>

      <Reveal>
        <HeroImage src={hero1Image} alt="Hero Image 1" />
      </Reveal>

      <Reveal>
        <FaqSection />
      </Reveal>

      <Reveal>
        <ImagesCarousel />
      </Reveal>

      <Reveal>
        <ReelsCarousel />
      </Reveal>

      <Reveal>
        <HeroImage src={hero2Image} alt="Hero Image 2" />
      </Reveal>
    </div>
  );
};

export default Index;
