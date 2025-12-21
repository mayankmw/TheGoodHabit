// src/components/Layout.jsx
import { Navbar } from "@/components/Navbar";
import { TopOffers } from "@/components/TopOffers";
import { Footer } from "@/components/Footer";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopOffers />
      <Navbar />

      {/* Page content */}
      <main className="flex-1">
        <Outlet /> {/* This renders the current page (Index, Product, etc.) */}
      </main>

      <Footer />

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

      <a
        href="https://wa.me/7827510913"
        // href="https://wa.me/8109855170"
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

    </div>
  );
};
