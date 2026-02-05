import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (
    (role === "officer" || role === "viewer") &&
    user?.must_change_password &&
    location.pathname !== "/force-change-password"
  ) {
    return <Navigate to="/force-change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (role === "officer") {
      return <Navigate to="/officer/dashboard" replace />;
    }
    if (role === "viewer") {
      return <Navigate to="/viewer/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}
