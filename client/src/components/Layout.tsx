// src/components/Layout.tsx
import { Navbar } from "@/components/Navbar";
import { TopOffers } from "@/components/TopOffers";
import { Footer } from "@/components/Footer";
import { Outlet } from "react-router-dom";
import { useCommonStore } from "@/store/useCommonStore";
import { useEffect } from "react";

export const Layout = () => {
  const fetchAssets = useCommonStore((s) => s.fetchAssets);
  const fetchSliders = useCommonStore((s) => s.fetchSliders);
  const fetchSocials = useCommonStore((s) => s.fetchSocials);

  const bottomSliders = useCommonStore((s) => s.sliders.bottom);
  const socials = useCommonStore((s) => s.socials);

  useEffect(() => {
    fetchAssets();
    fetchSliders();
    fetchSocials();
  }, [fetchAssets, fetchSliders, fetchSocials]);

  const whatsappUrl = socials?.whatsapp
    ? socials.whatsapp.startsWith("http")
      ? socials.whatsapp
      : `https://wa.me/${socials.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopOffers />
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {bottomSliders.length > 0 && (
        <div className="bg-foreground text-background py-4 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex items-center gap-8 text-lg font-bold">
            {bottomSliders.map((text, i) => (
              <span key={i}>{text}</span>
            ))}
          </div>
        </div>
      )}

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50"
        >
          <img
            src="/images/icons/whatsapp.svg"
            alt="WhatsApp"
            className="w-12 h-12 object-contain cursor-pointer"
          />
        </a>
      )}
    </div>
  );
};
