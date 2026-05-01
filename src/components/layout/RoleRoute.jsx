/**
 * RoleRoute Component
 *
 * Protects routes based on authentication and role.
 * Redirects users to their correct dashboard if unauthorized.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleRoute({ children, allowedRole }) {
  const { user, role, loading } = useAuth();

  // Loading state while Firebase auth initializes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch
  if (allowedRole && role !== allowedRole) {
    switch (role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;

      case "cashier":
        return <Navigate to="/cashier/dashboard" replace />;

      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Authorized
  return children;
}