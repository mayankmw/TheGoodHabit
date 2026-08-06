import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export const RequireAdmin = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [checking, setChecking] = useState(() => Boolean(token) && !user);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    if (user) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    fetchMe().finally(() => {
      if (!cancelled) setChecking(false);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fetchMe]);

  const isDenied = Boolean(token) && !checking && !user?.isAdmin;

  useEffect(() => {
    if (isDenied) toast.error("Access denied");
  }, [isDenied]);

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (isDenied) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
