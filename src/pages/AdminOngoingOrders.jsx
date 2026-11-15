import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { getRecentOrders } from "../services/orderService";
import { formatCurrency } from "../utils/formatting";

function formatDateTime(value) {
  if (!value) return "-";

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminOngoingOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await getRecentOrders(100);

    if (loadError) {
      setOrders([]);
      setError(loadError.message || "Failed to load ongoing tables.");
    } else {
      setOrders(
        (data || []).filter((order) => {
          const orderType = order.order_type || order.orderType;
          return (
            orderType === "dine-in" &&
            (order.status === "open" || order.status === "pending")
          );
        })
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-teal-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button
                onClick={() => navigate("/admin/dashboard")}
                className="mb-4 bg-slate-700 hover:bg-slate-800 text-white"
              >
                ← Go Back
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Manage Ongoing Tables
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Admins can review, reduce, or void printed KOT items for active
                dine-in orders.
              </p>
            </div>
            <Button onClick={loadOrders} disabled={loading} className="sm:self-end">
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6 text-gray-500">
              Loading ongoing tables...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-gray-500">
              No ongoing dine-in tables.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orders.map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                const itemCount = items.reduce(
                  (sum, item) => sum + (Number(item.quantity) || 0),
                  0
                );

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Table</p>
                        <h2 className="text-3xl font-bold text-teal-700">
                          #{order.table_number ?? order.tableNumber ?? "-"}
                        </h2>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-800">
                        {order.status || "pending"}
                      </span>
                    </div>

                    <dl className="mt-5 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Order</dt>
                        <dd className="font-medium text-gray-800">
                          {order.orderNumber || order.order_number || order.id}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Items</dt>
                        <dd className="font-medium text-gray-800">{itemCount}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Total</dt>
                        <dd className="font-bold text-gray-900">
                          {formatCurrency(order.total || 0)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Opened</dt>
                        <dd className="text-right text-gray-700">
                          {formatDateTime(order.createdAt || order.created_at)}
                        </dd>
                      </div>
                    </dl>

                    <Button
                      onClick={() =>
                        navigate(`/admin/ongoing-orders/${order.id}`)
                      }
                      className="mt-5 w-full bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      Manage Table
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
