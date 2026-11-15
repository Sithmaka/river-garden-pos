import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useMenu } from "../hooks/useMenu";
import { updateMenuItemProfitTracking } from "../services/menuService";
import { getPaidOrdersForAnalysis } from "../services/orderAnalysisService";
import { formatCurrency } from "../utils/formatting";

function toLocalDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function currentMonthInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthRange(monthValue) {
  const [year, month] = String(monthValue).split("-").map(Number);
  if (!year || !month) return { from: "", to: "" };

  return {
    from: toLocalDateInput(new Date(year, month - 1, 1)),
    to: toLocalDateInput(new Date(year, month, 0)),
  };
}

function getOrderItemId(item) {
  return item.id || item.menuId || item.menu_id || item.itemId || "";
}

function getOrderItemQuantity(item) {
  return Number(item.quantity ?? item.qty ?? 0) || 0;
}

function getOrderItemSales(item) {
  const quantity = getOrderItemQuantity(item);
  const price = Number(item.price ?? item.unitPrice ?? 0) || 0;
  return Number(item.line_total ?? item.lineTotal ?? quantity * price) || 0;
}

export default function ItemProfitMonitor() {
  const navigate = useNavigate();
  const { menuItems, loading: menuLoading, error: menuError, refetch } =
    useMenu(true);

  const now = useMemo(() => new Date(), []);
  const [rangeMode, setRangeMode] = useState("day");
  const [day, setDay] = useState(toLocalDateInput(now));
  const [month, setMonth] = useState(currentMonthInput(now));
  const [customFrom, setCustomFrom] = useState(toLocalDateInput(now));
  const [customTo, setCustomTo] = useState(toLocalDateInput(now));
  const [itemFilter, setItemFilter] = useState("all");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [reportError, setReportError] = useState("");

  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [configMessage, setConfigMessage] = useState("");

  const dateRange = useMemo(() => {
    if (rangeMode === "month") return getMonthRange(month);
    if (rangeMode === "custom") {
      return { from: customFrom, to: customTo };
    }
    return { from: day, to: day };
  }, [customFrom, customTo, day, month, rangeMode]);

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      if (!dateRange.from || !dateRange.to) return;

      setLoadingOrders(true);
      setReportError("");

      if (dateRange.from > dateRange.to) {
        setOrders([]);
        setReportError("The From date must be before the To date.");
        setLoadingOrders(false);
        return;
      }

      const { data, error } = await getPaidOrdersForAnalysis(
        dateRange.from,
        dateRange.to
      );

      if (cancelled) return;

      if (error) {
        setOrders([]);
        setReportError(error.message || "Failed to load sales data.");
      } else {
        setOrders(data || []);
      }
      setLoadingOrders(false);
    }

    loadReport();
    return () => {
      cancelled = true;
    };
  }, [dateRange.from, dateRange.to]);

  const trackedItems = useMemo(
    () => menuItems.filter((item) => item.profitMonitorEnabled),
    [menuItems]
  );

  const selectedMenuItem = useMemo(
    () => menuItems.find((item) => item.id === selectedMenuItemId) || null,
    [menuItems, selectedMenuItemId]
  );

  const reportRows = useMemo(() => {
    const salesByItem = new Map();

    for (const order of orders) {
      for (const item of Array.isArray(order.items) ? order.items : []) {
        const itemId = getOrderItemId(item);
        if (!itemId) continue;

        const current = salesByItem.get(itemId) || { quantity: 0, sales: 0 };
        current.quantity += getOrderItemQuantity(item);
        current.sales += getOrderItemSales(item);
        salesByItem.set(itemId, current);
      }
    }

    return trackedItems
      .filter((item) => itemFilter === "all" || item.id === itemFilter)
      .map((item) => {
        const sales = salesByItem.get(item.id) || { quantity: 0, sales: 0 };
        const costPrice = Number(item.costPrice) || 0;
        const totalCost = sales.quantity * costPrice;

        return {
          id: item.id,
          name: item.name,
          sellingPrice: Number(item.sellingPrice ?? item.price) || 0,
          costPrice,
          quantity: sales.quantity,
          totalCost,
          totalSales: sales.sales,
          profit: sales.sales - totalCost,
        };
      });
  }, [itemFilter, orders, trackedItems]);

  const totals = useMemo(
    () =>
      reportRows.reduce(
        (summary, row) => ({
          quantity: summary.quantity + row.quantity,
          cost: summary.cost + row.totalCost,
          sales: summary.sales + row.totalSales,
          profit: summary.profit + row.profit,
        }),
        { quantity: 0, cost: 0, sales: 0, profit: 0 }
      ),
    [reportRows]
  );

  function handleMenuItemSelection(itemId) {
    setSelectedMenuItemId(itemId);
    const item = menuItems.find((menuItem) => menuItem.id === itemId);
    setPurchasePrice(item ? String(Number(item.costPrice) || "") : "");
    setConfigMessage("");
  }

  async function handleTrackItem() {
    if (!selectedMenuItem) {
      setConfigMessage("Select a menu item first.");
      return;
    }

    const cost = Number(purchasePrice);
    if (!Number.isFinite(cost) || cost < 0) {
      setConfigMessage("Enter a valid purchase price.");
      return;
    }

    setSavingItem(true);
    setConfigMessage("");
    const { error } = await updateMenuItemProfitTracking(selectedMenuItem.id, {
      enabled: true,
      costPrice: cost,
    });

    if (error) {
      setConfigMessage(error.message || "Failed to save item.");
    } else {
      await refetch();
      setConfigMessage(`${selectedMenuItem.name} added to the monitor.`);
      setSelectedMenuItemId("");
      setPurchasePrice("");
    }
    setSavingItem(false);
  }

  async function handleRemoveItem(item) {
    setSavingItem(true);
    setConfigMessage("");
    const { error } = await updateMenuItemProfitTracking(item.id, {
      enabled: false,
      costPrice: item.costPrice,
    });

    if (error) {
      setConfigMessage(error.message || "Failed to remove item.");
    } else {
      await refetch();
      if (itemFilter === item.id) setItemFilter("all");
      setConfigMessage(`${item.name} removed from the monitor.`);
    }
    setSavingItem(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            className="mb-4 bg-slate-700 hover:bg-slate-800 text-white"
          >
            ← Go Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Item Profit Monitor
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-500">
            Monitor selected menu-item cost, sales, and profit by day, month, or
            custom date range.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">Tracked Items</h2>
          <p className="mt-1 text-sm text-slate-500">
            Selling price comes from Menu Management. Enter the purchase price
            used to calculate cost and profit.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3">
            <select
              value={selectedMenuItemId}
              onChange={(event) => handleMenuItemSelection(event.target.value)}
              className="h-12 rounded-xl border border-slate-300 px-3 bg-white"
            >
              <option value="">Select menu item</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — Selling {formatCurrency(item.sellingPrice || 0)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchasePrice}
              onChange={(event) => setPurchasePrice(event.target.value)}
              placeholder="Purchase price"
              className="h-12 rounded-xl border border-slate-300 px-3"
            />
            <Button
              onClick={handleTrackItem}
              disabled={savingItem || menuLoading}
              className="h-12 whitespace-nowrap"
            >
              {savingItem ? "Saving..." : "Add / Update Item"}
            </Button>
          </div>

          {selectedMenuItem && (
            <p className="mt-2 text-sm text-slate-600">
              Selling price: {formatCurrency(selectedMenuItem.sellingPrice || 0)}
            </p>
          )}
          {(configMessage || menuError) && (
            <p className="mt-3 text-sm text-slate-700">
              {configMessage || menuError?.message || String(menuError)}
            </p>
          )}

          {trackedItems.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {trackedItems.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-teal-900">
                    {item.name}: Cost {formatCurrency(item.costPrice || 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item)}
                    disabled={savingItem}
                    className="font-bold text-red-600 hover:text-red-800"
                    aria-label={`Remove ${item.name} from profit monitor`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Date Range
              </label>
              <select
                value={rangeMode}
                onChange={(event) => setRangeMode(event.target.value)}
                className="w-full h-12 rounded-xl border border-slate-300 px-3 bg-white"
              >
                <option value="day">Daily</option>
                <option value="month">Monthly</option>
                <option value="custom">Custom Dates</option>
              </select>
            </div>

            {rangeMode === "day" && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Day
                </label>
                <input
                  type="date"
                  value={day}
                  onChange={(event) => setDay(event.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-300 px-3"
                />
              </div>
            )}

            {rangeMode === "month" && (
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">
                  Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-300 px-3"
                />
              </div>
            )}

            {rangeMode === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    From
                  </label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-300 px-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    To
                  </label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-300 px-3"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Item
              </label>
              <select
                value={itemFilter}
                onChange={(event) => setItemFilter(event.target.value)}
                className="w-full h-12 rounded-xl border border-slate-300 px-3 bg-white"
              >
                <option value="all">All tracked items</option>
                {trackedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {reportError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {reportError}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <SummaryCard label="Quantity Sold" value={totals.quantity.toLocaleString()} />
          <SummaryCard label="Total Cost" value={formatCurrency(totals.cost)} />
          <SummaryCard label="Total Sales" value={formatCurrency(totals.sales)} />
          <SummaryCard
            label="Profit"
            value={formatCurrency(totals.profit)}
            valueClass={totals.profit < 0 ? "text-red-600" : "text-emerald-600"}
          />
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Item Results</h2>
            <p className="mt-1 text-sm text-slate-500">
              {dateRange.from} to {dateRange.to}
            </p>
          </div>

          {loadingOrders || menuLoading ? (
            <div className="p-6 text-slate-500">Loading report...</div>
          ) : trackedItems.length === 0 ? (
            <div className="p-6 text-slate-500">
              Add at least one menu item to start monitoring profit.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeader>Item</TableHeader>
                    <TableHeader align="right">Purchase Price</TableHeader>
                    <TableHeader align="right">Selling Price</TableHeader>
                    <TableHeader align="right">Qty Sold</TableHeader>
                    <TableHeader align="right">Total Cost</TableHeader>
                    <TableHeader align="right">Total Sales</TableHeader>
                    <TableHeader align="right">Profit</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{formatCurrency(row.costPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.sellingPrice)}</TableCell>
                      <TableCell align="right">{row.quantity.toLocaleString()}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalCost)}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalSales)}</TableCell>
                      <TableCell
                        align="right"
                        className={row.profit < 0 ? "text-red-600" : "text-emerald-600"}
                      >
                        {formatCurrency(row.profit)}
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <TableCell>Total</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell align="right">{totals.quantity.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatCurrency(totals.cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(totals.sales)}</TableCell>
                    <TableCell
                      align="right"
                      className={totals.profit < 0 ? "text-red-600" : "text-emerald-600"}
                    >
                      {formatCurrency(totals.profit)}
                    </TableCell>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, valueClass = "text-slate-900" }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
      <p className="text-xs sm:text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-xl sm:text-2xl font-bold ${valueClass}`}>{value}</p>
    </div>
  );
}

function TableHeader({ children, align = "left" }) {
  const alignmentClass = align === "right" ? "text-right" : "text-left";

  return (
    <th className={`px-4 py-3 ${alignmentClass} text-xs font-bold uppercase text-slate-600`}>
      {children}
    </th>
  );
}

function TableCell({ children, align = "left", className = "" }) {
  const alignmentClass = align === "right" ? "text-right" : "text-left";

  return (
    <td className={`px-4 py-3 ${alignmentClass} text-sm text-slate-800 ${className}`}>
      {children}
    </td>
  );
}
