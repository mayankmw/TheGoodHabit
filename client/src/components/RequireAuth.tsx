import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export const RequireAuth = () => {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    // carry the destination through sign-in, so a link like
    // /track-order?code=NB000123 from an order email still lands correctly
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
