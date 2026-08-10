// src/components/admin/AdminNavbar.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LayoutDashboard, Package, ShoppingBag, LogOut, Image, TicketPercent, Rows, BookOpen, MessageSquare, Mail, Share2, Layers, ChevronUp, ChevronDown, Film, Users } from "lucide-react";
import { useCommonStore } from "@/store/useCommonStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LOGO_FALLBACK } from "@/lib/assetFallbacks";

export const AdminNavbar = () => {
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout(() => navigate("/signin"));
  };

  const { assets, fetchAssets, loadingAssets } = useCommonStore();
  const logoImage = assets?.logo?.[0]?.image || LOGO_FALLBACK;

  const menuItems = [
    {
      label: "Dashboard",
      to: "/admin",
      icon: <LayoutDashboard size={18} />,
    },
    {
      label: "Orders",
      to: "/admin/orders",
      icon: <ShoppingBag size={18} />,
    },
    {
      label: "Commerce",
      icon: <Package size={18} />,
      children: [
        { label: "Products", to: "/admin/products", icon: <Package size={16} /> },
        { label: "Coupons", to: "/admin/coupons", icon: <TicketPercent size={16} /> },
      ],
    },
    {
      label: "Content Management",
      icon: <Layers size={18} />,
      children: [
        { label: "Assets", to: "/admin/assets", icon: <Image size={16} /> },
        { label: "Sliders", to: "/admin/sliders", icon: <Rows size={16} /> },
        { label: "Reels", to: "/admin/reels", icon: <Film size={16} /> },
        { label: "Our Story", to: "/admin/story", icon: <BookOpen size={16} /> },
        { label: "Socials", to: "/admin/socials", icon: <Share2 size={16} /> },
      ],
    },
    {
      label: "Engagement",
      icon: <MessageSquare size={18} />,
      children: [
        { label: "Contacts", to: "/admin/contacts", icon: <MessageSquare size={16} /> },
        { label: "Newsletters", to: "/admin/newsletters", icon: <Mail size={16} /> },
        { label: "Subscribers", to: "/admin/newsletters/subscribers", icon: <Users size={16} /> },
      ],
    },
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

                {menuItems.map((item) =>
                  item.children ? (
                    <div key={item.label} className="space-y-2">
                      <button
                        onClick={() =>
                          setOpenSubmenu(
                            openSubmenu === item.label ? null : item.label
                          )
                        }
                        className="w-full flex justify-between items-center
                        text-lg font-medium py-2
                        border-b border-accent-foreground/20
                        hover:text-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          {item.label}
                        </div>

                        {openSubmenu === item.label ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>


                      {openSubmenu === item.label && (
                        <div className="ml-6 space-y-1">
                          {item.children.map((child) => (
                            <NavLink
                              key={child.to}
                              to={child.to}
                              onClick={() => setOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-2 text-sm py-2 transition
                                ${isActive ? "text-secondary" : "hover:text-secondary"}`
                              }
                            >
                              {child.icon}
                              {child.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )
                )}


                <button
                  className="flex items-center gap-3 text-lg py-2 text-red-400 hover:text-red-500"
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
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
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary/80">
              <LogOut className="h-6 w-6 cursor-pointer" />
            </Button>

          </div>
        </div>
      </div>
    </nav>
  );
};
