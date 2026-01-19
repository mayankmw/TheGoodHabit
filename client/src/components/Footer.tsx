import { useState } from "react";
import { useCommonStore } from "@/store/useCommonStore";
import { toast } from "sonner";

export const Footer = () => {
  const socials = useCommonStore((s) => s.socials);

  const subscribeNewsletter = useCommonStore(
    (s) => s.subscribeNewsletter
  );
  const loadingNewsletter = useCommonStore(
    (s) => s.loadingNewsletter
  );

  const [email, setEmail] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    const res = await subscribeNewsletter(email);

    if (res?.success) {
      toast.success(res.message || "Subscribed successfully");
      setEmail("");
    } else {
      toast.error(res?.message || "Subscription failed");
    }
  };

  return (
    <footer className="relative bg-accent text-accent-foreground">
      {/* Glow accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,215,0,0.08),transparent)] pointer-events-none" />

      <div className="relative container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Section */}
        <div className="text-center md:text-left space-y-3">
          <h3 className="text-2xl font-extrabold text-white tracking-widest">
            The Good Habit
          </h3>
          <p className="text-sm max-w-xs text-gray-400">
            Fuel your journey to better health — one mindful choice at a time.
          </p>

          <div className="flex justify-center md:justify-start gap-5 pt-3">
            {/* Instagram */}
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-pink-500 transition-all hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm4.75-.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
                </svg>
              </a>
            )}

            {/* LinkedIn */}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-muted-foreground hover:text-blue-600 transition-all hover:scale-110"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.99h4V24h-4V8.99zM8.5 8.99h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.09V24h-4v-7.8c0-1.86-.03-4.25-2.59-4.25-2.6 0-3 2.03-3 4.12V24h-4V8.99z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h4 className="text-lg font-semibold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/our-story" className="hover:text-yellow-400 transition-colors">
                Our Story
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-yellow-400 transition-colors">
                Contact
              </a>
            </li>
            <li>
              <a href="/terms-and-conditions" className="hover:text-yellow-400 transition-colors">
                Terms & Condition
              </a>
            </li>
            <li>
              <a href="/privacy-policy" className="hover:text-yellow-400 transition-colors">
                Privacy Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="text-center md:text-right space-y-3">
          <h4 className="text-lg font-semibold text-white">Stay Updated</h4>
          <p className="text-sm text-gray-400">
            Subscribe to get the latest offers and healthy tips!
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex justify-center md:justify-end gap-2"
          >
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loadingNewsletter}
              className="bg-zinc-800 text-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-48 disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={loadingNewsletter}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors disabled:opacity-60"
            >
              {loadingNewsletter ? "Joining..." : "Join"}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="border-t border-zinc-800 text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} The Good Habit. All rights reserved.
      </div>
    </footer>
  );
};
