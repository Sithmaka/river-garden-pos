/**
 * Admin Dashboard
 *
 * Landing page for admin users with navigation to key features.
 * Displays welcome message, user info, and navigation cards to admin functions.
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import { db } from "../services/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function AdminDashboard() {
  const { user, role } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        const q = query(collection(db, "users"), limit(1));
        await getDocs(q);
        setIsConnected(true);
      } catch (err) {
        console.error("Firebase connection check failed:", err);
        setIsConnected(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkFirebaseConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <h1
            className="text-3xl font-bold text-gray-700 mb-2"
            data-testid="admin-welcome"
          >
            🌳 River Garden Resort - Admin Dashboard
          </h1>

          <div className="flex items-center gap-4 mb-3">
            <p className="text-gray-600" data-testid="admin-email">
              {user?.email}
            </p>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-500"
              data-testid="admin-role-badge"
            >
              {role?.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isCheckingConnection ? (
              <div className="flex items-center text-gray-500 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
                System Status: Checking...
              </div>
            ) : isConnected ? (
              <div
                className="flex items-center text-green-600 text-sm font-medium"
                data-testid="connection-status"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                ✓ System Status: Connected to Firebase
              </div>
            ) : (
              <div
                className="flex items-center text-red-600 text-sm font-medium"
                data-testid="connection-status"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                ⚠ System Status: Connection Error
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/menu" className="block h-full">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Menu Management
                </h2>
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex-grow">
                Manage menu items, categories, and pricing
              </p>
              <Button variant="primary">Manage Menu</Button>
            </div>
          </Link>

          <Link to="/admin/settings" className="block h-full">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Settings
                </h2>
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex-grow">
                Configure service charge and currency settings
              </p>
              <Button variant="primary">Configure Settings</Button>
            </div>
          </Link>

          <Link to="/admin/users" className="block h-full">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  User Management
                </h2>
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex-grow">
                Manage staff accounts and permissions
              </p>
              <Button variant="primary">Manage Users</Button>
            </div>
          </Link>

          <Link to="/admin/orders" className="block h-full">
            <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Order History
                </h2>
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4 flex-grow">
                View and reprint receipts
              </p>
              <Button variant="primary">View Orders</Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}