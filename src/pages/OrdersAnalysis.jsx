import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import Button from "../components/ui/Button";
import { getPaidOrdersForAnalysis } from "../services/orderAnalysisService";
import { formatCurrency } from "../utils/formatting";
import { useNavigate } from "react-router-dom";

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date) {
  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getItemId(item) {
  return item.id || item.menuId || item.menu_id || item.itemId || item.name || "unknown";
}

function getItemName(item) {
  return item.name || item.itemName || "Unknown Item";
}

function getItemQty(item) {
  return Number(item.quantity ?? item.qty ?? 0) || 0;
}

function getItemTotal(item) {
  const qty = getItemQty(item);
  const price = Number(item.price ?? item.unitPrice ?? 0) || 0;
  return Number(item.line_total ?? item.lineTotal ?? qty * price) || 0;
}

export default function OrdersAnalysis() {
  const navigate = useNavigate();

  const today = new Date();

  const [fromDate, setFromDate] = useState(toInputDate(new Date(today.getFullYear(), 0, 1)));
  const [toDate, setToDate] = useState(toInputDate(today));
  const [quickRange, setQuickRange] = useState("this-year");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalysis() {
    setLoading(true);
    setError("");

    const { data, error } = await getPaidOrdersForAnalysis(fromDate, toDate);

    if (error) {
      setError(error.message || "Failed to load order analysis.");
      setOrders([]);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAnalysis();
  }, [fromDate, toDate]);

  function applyQuickRange(value) {
    setQuickRange(value);

    const now = new Date();
    let start = null;
    let end = now;

    if (value === "all") {
      setFromDate("");
      setToDate("");
      return;
    }

    if (value === "this-month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (value === "last-30") {
      start = new Date(now);
      start.setDate(start.getDate() - 30);
    }

    if (value === "last-90") {
      start = new Date(now);
      start.setDate(start.getDate() - 90);
    }

    if (value === "this-year") {
      start = new Date(now.getFullYear(), 0, 1);
    }

    setFromDate(start ? toInputDate(start) : "");
    setToDate(toInputDate(end));
  }

  const monthlyRows = useMemo(() => {
    const map = new Map();

    for (const order of orders) {
      const paidAt = parseDate(order.paid_at || order.paidAt || order.createdAt);
      if (!paidAt) continue;

      const key = getMonthKey(paidAt);

      if (!map.has(key)) {
        map.set(key, {
          key,
          month: getMonthLabel(paidAt),
          totalSales: 0,
          totalOrders: 0,
          serviceCharge: 0,
        });
      }

      const row = map.get(key);
      row.totalSales += Number(order.total || 0);
      row.totalOrders += 1;
      row.serviceCharge += Number(
        order.service_charge_amount ?? order.serviceChargeAmount ?? order.serviceCharge ?? 0
      );
    }

    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((row) => ({
        ...row,
        avgOrderValue: row.totalOrders ? row.totalSales / row.totalOrders : 0,
      }));
  }, [orders]);

  const menuItemRows = useMemo(() => {
    const map = new Map();

    for (const order of orders) {
      const items = Array.isArray(order.items) ? order.items : [];

      for (const item of items) {
        const id = getItemId(item);
        const name = getItemName(item);
        const qty = getItemQty(item);
        const sales = getItemTotal(item);

        if (!map.has(id)) {
          map.set(id, {
            id,
            name,
            quantity: 0,
            sales: 0,
            orders: 0,
          });
        }

        const row = map.get(id);
        row.quantity += qty;
        row.sales += sales;
        row.orders += 1;
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.sales - a.sales)
      .map((row) => ({
        ...row,
        avgPrice: row.quantity ? row.sales / row.quantity : 0,
      }));
  }, [orders]);

  const totals = useMemo(() => {
    const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = orders.length;
    const serviceCharge = orders.reduce(
      (sum, o) =>
        sum +
        (Number(o.service_charge_amount ?? o.serviceChargeAmount ?? o.serviceCharge ?? 0) || 0),
      0
    );

    return {
      totalSales,
      totalOrders,
      serviceCharge,
      avgOrderValue: totalOrders ? totalSales / totalOrders : 0,
    };
  }, [orders]);

  const bestMonth = monthlyRows.reduce(
    (best, row) => (!best || row.totalSales > best.totalSales ? row : best),
    null
  );

  const highestOrderMonth = monthlyRows.reduce(
    (best, row) => (!best || row.totalOrders > best.totalOrders ? row : best),
    null
  );

  const topItem = menuItemRows[0];

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
                <Button
                onClick={() => navigate("/admin/dashboard")}
                className="mb-4 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2"
                >
                ← Go Back
                </Button>

                <h1 className="text-3xl font-bold text-slate-900">Orders Analysis</h1>
                <p className="text-slate-500 mt-2 max-w-4xl">
                Analyze order history by month with total sales, total orders, and service charge.
                Use the calendar range filter to focus on any period. This page uses{" "}
                <b>paid_at</b> as the transaction date, <b>total</b> as total sales, and{" "}
                <b>service_charge_amount</b> as service charge.
                </p>
            </div>

            <Button
                onClick={loadAnalysis}
                className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2"
            >
                Refresh
            </Button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-500 mb-2">Quick Range</label>
              <select
                value={quickRange}
                onChange={(e) => applyQuickRange(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 px-4 font-semibold bg-white"
              >
                <option value="all">All Dates</option>
                <option value="this-month">This Month</option>
                <option value="last-30">Last 30 Days</option>
                <option value="last-90">Last 90 Days</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 text-slate-500 font-semibold">
            Loading analysis...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card title="Total Sales" value={formatCurrency(totals.totalSales)} sub={`${totals.totalOrders} filtered orders`} color="text-blue-700" />
              <Card title="Total Orders" value={totals.totalOrders.toLocaleString()} sub="Count of paid orders in range" color="text-green-600" />
              <Card title="Service Charge" value={formatCurrency(totals.serviceCharge)} sub="Sum of service_charge_amount" color="text-orange-500" />
              <Card title="Average Order Value" value={formatCurrency(totals.avgOrderValue)} sub="Total Sales / Total Orders" color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Monthly Sales, Orders, and Service Charge
                </h2>

                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value, name) => {
                        if (name === "totalOrders") return [value, "Total Orders"];
                        return [formatCurrency(value), name];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalSales" name="Total Sales" fill="#93c5fd" />
                      <Bar yAxisId="left" dataKey="serviceCharge" name="Service Charge" fill="#f9a8d4" />
                      <Line yAxisId="right" type="monotone" dataKey="totalOrders" name="Total Orders" stroke="#f59e0b" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Summary</h2>

                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-600 space-y-3">
                  <p><b>Months in view:</b> {monthlyRows.length}</p>
                  <p><b>Best sales month:</b> {bestMonth ? `${bestMonth.month} (${formatCurrency(bestMonth.totalSales)})` : "-"}</p>
                  <p><b>Highest order month:</b> {highestOrderMonth ? `${highestOrderMonth.month} (${highestOrderMonth.totalOrders.toLocaleString()} orders)` : "-"}</p>
                  <p><b>Service charge rate:</b> {totals.totalSales ? ((totals.serviceCharge / totals.totalSales) * 100).toFixed(2) : "0.00"}%</p>
                  <p><b>Top menu item:</b> {topItem ? `${topItem.name} (${formatCurrency(topItem.sales)})` : "-"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Monthly Breakdown</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Month</Th>
                      <Th align="right">Total Sales</Th>
                      <Th align="right">Total Orders</Th>
                      <Th align="right">Service Charge</Th>
                      <Th align="right">Avg Order Value</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyRows.map((row) => (
                      <tr key={row.key} className="border-b">
                        <Td>{row.month}</Td>
                        <Td align="right">{formatCurrency(row.totalSales)}</Td>
                        <Td align="right">{row.totalOrders.toLocaleString()}</Td>
                        <Td align="right">{formatCurrency(row.serviceCharge)}</Td>
                        <Td align="right">{formatCurrency(row.avgOrderValue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Sales by Menu Items
                </h2>

                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={menuItemRows.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="sales" name="Item Sales" fill="#14b8a6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  Top Quantity Items
                </h2>

                <div className="space-y-3">
                  {menuItemRows.slice(0, 8).map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-bold text-slate-900">
                          {index + 1}. {item.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Qty: {item.quantity.toLocaleString()}
                        </p>
                      </div>
                      <div className="font-bold text-teal-600">
                        {formatCurrency(item.sales)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Menu Item Breakdown</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Menu Item</Th>
                      <Th align="right">Quantity Sold</Th>
                      <Th align="right">Total Sales</Th>
                      <Th align="right">Average Price</Th>
                      <Th align="right">Order Count</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItemRows.map((row) => (
                      <tr key={row.id} className="border-b">
                        <Td>{row.name}</Td>
                        <Td align="right">{row.quantity.toLocaleString()}</Td>
                        <Td align="right">{formatCurrency(row.sales)}</Td>
                        <Td align="right">{formatCurrency(row.avgPrice)}</Td>
                        <Td align="right">{row.orders.toLocaleString()}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <p className="text-slate-500 font-bold">{title}</p>
      <h2 className={`text-3xl font-extrabold mt-2 ${color}`}>{value}</h2>
      <p className="text-slate-500 font-semibold mt-2">{sub}</p>
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th className={`px-5 py-4 text-${align} text-sm font-extrabold text-slate-600 uppercase`}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }) {
  return (
    <td className={`px-5 py-4 text-${align} text-slate-900 font-medium`}>
      {children}
    </td>
  );
}