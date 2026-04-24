import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <Leaf className="w-20 h-20 text-yellow-400 animate-pulse" />
            <span className="absolute inset-0 blur-3xl bg-yellow-500/20 rounded-full" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tight">
          404
        </h1>

        {/* Subtext */}
        <p className="text-lg md:text-xl text-gray-300">
          Oops! Looks like this page got lost in the snack aisle 🍫
        </p>

        {/* Action */}
        <Button
          asChild
          className="mt-4 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 transition-transform hover:scale-105"
        >
          <a href="/" className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Return to Home
          </a>
        </Button>

        {/* Decorative text */}
        <p className="text-sm text-gray-500">
          Fuel your next click — NoshBOB awaits 🌿
        </p>
      </div>
    </div>
  );
};

export default NotFound;
