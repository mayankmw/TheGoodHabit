import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// BrowserRouter keeps the window's scroll offset across route changes, so a
// product opened from halfway down the homepage would land mid-page. Back/
// forward (POP) is left alone so the browser can restore the previous spot.
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP" || hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;
