import { Outlet } from "react-router-dom";
import { AdminNavbar } from "@/components/AdminNavbar";

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminNavbar />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
