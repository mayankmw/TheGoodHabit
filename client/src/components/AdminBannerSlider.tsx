// components/AdminBannerSlider.tsx
import { Pencil } from "lucide-react";
import { BannerSlider } from "./BannerSlider";
import { useState } from "react";

export const AdminBannerSlider = ({
  banners,
  onEdit,
}: {
  banners: BannerItem[];
  onEdit: (banner: BannerItem) => void;
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="relative">
      {/* Public slider */}
      <BannerSlider
        banners={banners}
        onSlideChange={setActiveIndex}
      />

      {/* Admin overlay */}
      {banners[activeIndex] && (
        <button
          onClick={() => onEdit(banners[activeIndex])}
          className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-black text-white p-2 rounded-full shadow"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
