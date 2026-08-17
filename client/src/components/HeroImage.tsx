// components/HeroImage.tsx
import { Skeleton } from "@/components/ui/skeleton";

const HeroImage = ({
  src = "/images/hero/hero-image.png",
  alt = "Hero Image",
  maxW = "1200",
  loading = false,
}) => {
  return (
    <section className="flex justify-center px-4 py-10">
      <div className="w-full" style={{ maxWidth: `${maxW}px` }}>
        {loading ? (
          <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-auto object-contain rounded-2xl select-none shadow-soft"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </section>
  );
};

export default HeroImage;
