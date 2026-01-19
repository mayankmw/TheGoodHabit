// src/components/admin/AdminNavbar.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, Package, ShoppingBag, LogOut, Image, TicketPercent, Rows, BookOpen } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";

export const AdminNavbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

    const { assets, fetchAssets, loadingAssets } = useCommonStore();
    const logoImage =
    assets?.logo?.[0]?.image || "/images/logo/logo.png";

  const menuItems = [
    { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} /> },
    { label: "Products", to: "/admin/products", icon: <Package size={18} /> },
    { label: "Orders", to: "/admin/orders", icon: <ShoppingBag size={18} /> },
    { label: "Coupons", to: "/admin/coupons", icon: <TicketPercent size={18} /> },
    { label: "Assets", to: "/admin/assets", icon: <Image size={18} /> },
    { label: "Sliders", to: "/admin/sliders", icon: <Rows size={18} /> },
    { label: "Our Story", to: "/admin/story", icon: <BookOpen size={18} /> },
    { label: "Socials", to: "/admin/socials", icon: <BookOpen size={18} /> },
    { label: "Contacts", to: "/admin/contacts", icon: <BookOpen size={18} /> },
    { label: "newsletters", to: "/admin/newsletters", icon: <BookOpen size={18} /> },
  ];

    useEffect(() => {
      fetchAssets();
    }, [fetchAssets]);

  return (
    <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 relative">

          {/* LEFT HAMBURGER */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary/80"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="left"
              className="w-80 bg-accent text-accent-foreground overflow-y-auto
              bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent)]"
            >
              <div className="flex flex-col gap-6 mt-10">
                <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>

                {menuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 text-lg font-medium py-2
                      border-b border-accent-foreground/20 transition
                      ${isActive ? "text-secondary" : "hover:text-secondary"}`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}

                <button
                  className="flex items-center gap-3 text-lg py-2 text-red-400 hover:text-red-500"
                  onClick={() => navigate("/")}
                >
                  <LogOut size={18} />
                  Exit Admin
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* CENTER LOGO */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <a href="/" className="block">
                <img
                    src={logoImage}
                    alt="Logo"
                    className="h-20 w-25 object-contain drop-shadow-md"
                    loading="eager"
                  />
              </a>
            </div>

          {/* RIGHT EMPTY (to balance layout visually) */}
          <div className="w-8" />


            <div className="flex items-center gap-0.2 sm:gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary/80">
                <LogOut className="h-6 w-6 cursor-pointer" />
              </Button>

            </div>
        </div>
      </div>
    </nav>
  );
};
