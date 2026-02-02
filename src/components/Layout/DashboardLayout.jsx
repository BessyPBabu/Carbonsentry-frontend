import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout() {
  const { isAuthenticated, loading, role, organizationName, logout } =
    useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={role} organizationName={organizationName} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          role={role}
          organizationName={organizationName}
          onLogout={logout}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
