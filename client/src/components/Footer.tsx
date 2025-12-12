export const Footer = () => {
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
        <a
            href="#"
            aria-label="Instagram"
            className="text-muted-foreground hover:text-pink-500 transition-all hover:scale-110"
        >
            <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            >
            <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm4.75-.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
            </svg>
        </a>

        {/* Facebook */}
        <a
            href="#"
            aria-label="Facebook"
            className="text-muted-foreground hover:text-blue-600 transition-all hover:scale-110"
        >
            <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            >
            <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.96 3.64 9.07 8.4 9.86v-6.98H7.9v-2.88h2.36v-2.2c0-2.34 1.39-3.64 3.52-3.64 1.02 0 2.09.18 2.09.18v2.3h-1.18c-1.17 0-1.53.73-1.53 1.48v1.88h2.6l-.42 2.88h-2.18v6.98c4.76-.79 8.4-4.9 8.4-9.86z" />
            </svg>
        </a>
        </div>

        </div>

        {/* Quick Links */}
        <div className="text-center">
          <h4 className="text-lg font-semibold text-white mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            {/* <li>
              <a href="#shop" className="hover:text-yellow-400 transition-colors">
                Shop
              </a>
            </li> */}
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
          <form className="flex justify-center md:justify-end gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="bg-zinc-800 text-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-48"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition-colors"
            >
              Join
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
