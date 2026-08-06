import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

export const RequireAuth = () => {
  const token = useAuthStore((s) => s.token);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
