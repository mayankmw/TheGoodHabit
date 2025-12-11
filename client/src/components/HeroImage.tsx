// components/HeroImage.tsx

const HeroImage = ({
  src = "/images/hero/hero-image.png",
  alt = "Hero Image",
  maxW = "1200",
}) => {
  return (
    <section className="flex justify-center">
      <div className={`max-w-[${maxW}px] w-full`}>
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-2xl select-none"
          loading="lazy"
          draggable={false}
        />
      </div>
    </section>
  );
};

export default HeroImage;
