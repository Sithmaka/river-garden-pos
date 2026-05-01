/**
 * Cashier Dashboard
 *
 * Landing page for cashier users with order entry interface.
 * Displays welcome message, ongoing dine-in tables, and real-time menu preview.
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useMenu } from "../hooks/useMenu";
import { formatCurrency } from "../utils/formatting";
import { getRecentOrders } from "../services/orderService";

export default function CashierDashboard() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const [ongoingOrders, setOngoingOrders] = useState([]);
  const [loadingOngoing, setLoadingOngoing] = useState(true);

  const {
    menuItems,
    loading: menuLoading,
    error: menuError,
    realtimeConnected,
  } = useMenu(true);

  useEffect(() => {
    async function initializeDashboard() {
      try {
        setIsCheckingConnection(true);

        const { data, error } = await getRecentOrders(50);

        if (error) {
          console.error("Failed to fetch recent orders:", error);
          setIsConnected(false);
          setOngoingOrders([]);
        } else {
          setIsConnected(true);

          const filtered = (data || []).filter((order) => {
            const orderType = order.order_type || order.orderType;
            const status = order.status;
            return (
              orderType === "dine-in" &&
              (status === "open" || status === "pending")
            );
          });

          setOngoingOrders(filtered);
        }
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        setIsConnected(false);
        setOngoingOrders([]);
      } finally {
        setLoadingOngoing(false);
        setIsCheckingConnection(false);
      }
    }

    initializeDashboard();
  }, []);

  const groupedMenuCategories = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];

    const uniqueCategories = menuItems
      .map((item) => item.category)
      .filter(Boolean)
      .filter(
        (cat, index, self) =>
          index === self.findIndex((c) => c?.id === cat?.id)
      )
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return uniqueCategories;
  }, [menuItems]);

  const formatCreatedTime = (value) => {
    if (!value) return "-";

    try {
      let dateObj = null;

      if (typeof value?.toDate === "function") {
        dateObj = value.toDate();
      } else {
        dateObj = new Date(value);
      }

      if (Number.isNaN(dateObj.getTime())) return "-";
      return dateObj.toLocaleTimeString();
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1
                className="text-3xl font-bold text-gray-700 mb-2"
                data-testid="cashier-welcome"
              >
                🌳 River Garden Resort - Cashier
              </h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-600" data-testid="cashier-email">
                  {user?.email}
                </p>
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-50 text-teal-700 border border-teal-500"
                  data-testid="cashier-role-badge"
                >
                  {role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
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

            {realtimeConnected ? (
              <div className="flex items-center text-green-600 text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                🔄 Real-time sync active
              </div>
            ) : (
              <div className="flex items-center text-amber-600 text-sm font-medium">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                ⚠ Menu updates every 60 seconds
              </div>
            )}
          </div>
        </div>

        {/* Ongoing Dine-In Tables */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-teal-200">
            <h2 className="text-xl font-bold text-teal-700 mb-4">
              Ongoing Dine-In Tables
            </h2>

            {loadingOngoing ? (
              <div className="text-gray-500">Loading ongoing tables...</div>
            ) : ongoingOrders.length === 0 ? (
              <div className="text-gray-500">No ongoing dine-in tables.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Table #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Order #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {ongoingOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2 font-bold text-teal-700">
                        {order.table_number ?? order.tableNumber ?? "-"}
                      </td>
                      <td className="px-4 py-2">
                        {order.orderNumber || order.order_number || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs uppercase">
                          {order.status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {formatCreatedTime(order.createdAt || order.created_at)}
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/waiter/order/${order.id}`)}
                          className="bg-teal-500 hover:bg-teal-700 text-white px-3 py-1 rounded"
                        >
                          Update/Add Items
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">New Order</h2>
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Start taking a new customer order
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/cashier/order")}
              className="w-full"
            >
              Start New Order
            </Button>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-lg hover:border-teal-500 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Order History
              </h2>
              <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">View and reprint past orders</p>
            <Button
              variant="primary"
              onClick={() => navigate("/cashier/orders")}
              className="w-full"
            >
              View Order History
            </Button>
          </div>
        </div>

        {/* Real-Time Menu Display */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-700">
                🍽️ Available Menu Items
              </h2>
              <div className="text-sm text-gray-600">
                {menuLoading ? "Loading..." : `${menuItems.length} items`}
              </div>
            </div>

            {menuError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {typeof menuError === "string"
                  ? menuError
                  : menuError?.message || "Failed to load menu"}
              </div>
            )}

            {menuLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading menu...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">Menu is empty. Contact admin.</p>
              </div>
            ) : groupedMenuCategories.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  All Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menuItems.map((item) => {
                    const isAvailable =
                      item.isAvailable ?? item.is_available ?? true;

                    return (
                      <div
                        key={item.id}
                        className={`bg-gray-50 rounded-lg p-4 border transition-all ${
                          isAvailable
                            ? "border-gray-200 hover:border-teal-500 hover:shadow-sm"
                            : "border-gray-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4
                            className={`font-semibold ${
                              isAvailable ? "text-gray-900" : "text-gray-500"
                            }`}
                          >
                            {item.name}
                          </h4>

                          {!isAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Unavailable
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-lg font-bold ${
                            isAvailable ? "text-teal-600" : "text-gray-400"
                          }`}
                        >
                          {formatCurrency(item.price)}
                        </p>

                        {item.description && (
                          <p
                            className={`text-sm mt-2 ${
                              isAvailable ? "text-gray-600" : "text-gray-400"
                            }`}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedMenuCategories.map((category) => {
                  const categoryItems = menuItems.filter(
                    (item) => item.category?.id === category.id
                  );

                  return (
                    <div
                      key={category.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        {category.name}
                        <span className="text-sm font-normal text-gray-500">
                          ({categoryItems.length})
                        </span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryItems.map((item) => {
                          const isAvailable =
                            item.isAvailable ?? item.is_available ?? true;

                          return (
                            <div
                              key={item.id}
                              className={`bg-gray-50 rounded-lg p-4 border transition-all ${
                                isAvailable
                                  ? "border-gray-200 hover:border-teal-500 hover:shadow-sm"
                                  : "border-gray-200 opacity-60"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4
                                  className={`font-semibold ${
                                    isAvailable
                                      ? "text-gray-900"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {item.name}
                                </h4>

                                {!isAvailable && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Unavailable
                                  </span>
                                )}
                              </div>

                              <p
                                className={`text-lg font-bold ${
                                  isAvailable
                                    ? "text-teal-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {formatCurrency(item.price)}
                              </p>

                              {item.description && (
                                <p
                                  className={`text-sm mt-2 ${
                                    isAvailable
                                      ? "text-gray-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-teal-50 border border-teal-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-teal-900 mb-2">
            ℹ️ Quick Tip
          </h3>
          <p className="text-teal-700">
            Click "Start New Order" to begin taking orders. Menu updates in
            real-time when admin makes changes.
          </p>
        </div>
      </div>
    </div>
  );
}