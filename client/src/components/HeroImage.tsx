// components/HeroImage.tsx

const HeroImage = ({
  src = "/images/hero/hero-image.png",
  alt = "Hero Image",
  maxW = "1200",
}) => {
  return (
    <section className="flex justify-center px-4 py-10">
      <div className="w-full" style={{ maxWidth: `${maxW}px` }}>
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-2xl select-none shadow-soft"
          loading="lazy"
          draggable={false}
        />
      </div>
    </section>
  );
};

export default HeroImage;
