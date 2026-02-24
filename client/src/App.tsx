import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OurStory from "./pages/OurStory";
import SignIn from "./pages/SignIn";
import Product from "./pages/Product";
import TrackOrder from "./pages/TrackOrder";
import Blogs from "./pages/Blogs";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "@/components/AdminLayout";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminAssets from "./pages/AdminAssets";
import AdminCoupons from "./pages/AdminCoupons";
import AdminSliders from "./pages/AdminSliders";
import AdminStory from "./pages/AdminStory";
import AdminSocials from "./pages/AdminSocials";
import AdminContacts from "./pages/AdminContacts";
import AdminNewsletter from "./pages/AdminNewsletter";
import AdminNewsletterSubscribers from "./pages/AdminNewsletterSubscribers";
import AdminReels from "./pages/AdminReels";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Layout routes (have navbar, top offers, footer, etc.) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/our-story" element={<OurStory />} />
            <Route path="/products/:id" element={<Product />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/privacy-policy" element={<Privacy />} />
            <Route
              path="/signin"
              element={
                localStorage.getItem("token")
                  ? <Navigate to="/profile" replace />
                  : <SignIn />
              }
            />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="assets" element={<AdminAssets />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="sliders" element={<AdminSliders />} />
            <Route path="story" element={<AdminStory />} />
            <Route path="socials" element={<AdminSocials />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="newsletters" element={<AdminNewsletter />} />
            <Route path="newsletters/subscribers" element={<AdminNewsletterSubscribers />} />
            <Route path="reels" element={<AdminReels />} />
          </Route>

          {/* Standalone routes (no layout) */}

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
