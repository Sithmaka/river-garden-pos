import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRecentOrders } from "../services/orderHistoryService";
import { getReceiptData } from "../services/receiptService";
import { getSettings } from "../services/settingsService";
import { usePrinterConfiguration } from "../hooks/usePrinterConfiguration";
import { printerService } from "../services/printerService";
import { formatCurrency } from "../utils/formatting";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import CustomerReceipt from "../components/cashier/CustomerReceipt";
import KitchenReceipt from "../components/cashier/KitchenReceipt";
import toast from "react-hot-toast";

const PAGE_SIZE = 50;

export default function OrderHistory({ role = "admin" }) {
  const navigate = useNavigate();
  const { customerPrinter, kitchenPrinter } = usePrinterConfiguration();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);

  const [showCustomerReceiptModal, setShowCustomerReceiptModal] = useState(false);
  const [showKitchenReceiptModal, setShowKitchenReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [settings, setSettings] = useState(null);

  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printConfirmMessage, setPrintConfirmMessage] = useState("");
  const [printError, setPrintError] = useState(null);
  const [showPrintError, setShowPrintError] = useState(false);

  const isPrintingRef = useRef(false);
  const lastPrintedRef = useRef(null);

  const theme =
    role === "admin"
      ? { bg: "bg-teal-500", hover: "hover:bg-teal-600" }
      : { bg: "bg-teal-600", hover: "hover:bg-teal-700" };

  const dashboardPath = role === "admin" ? "/admin/dashboard" : "/cashier/dashboard";

  useEffect(() => {
    loadOrders(true);
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await getSettings();
    if (data) setSettings(data);
  }

  async function loadOrders(reset = false) {
    if (reset) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(true);
    } else {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
    }

    setError(null);

    const { data, error: fetchError, lastDoc: newLastDoc, hasMore: more } =
      await getRecentOrders(PAGE_SIZE, reset ? null : lastDoc);

    if (fetchError) {
      setError("Failed to load order history. Please try again.");
    } else {
      setOrders((prev) => (reset ? data || [] : [...prev, ...(data || [])]));
      setLastDoc(newLastDoc || null);
      setHasMore(Boolean(more));
    }

    setLoading(false);
    setLoadingMore(false);
  }

  function getOrderNumber(order) {
    return order.orderNumber || order.orderId || order.order_number || "-";
  }

  function getOrderType(order) {
    return order.order_type || order.orderType || "";
  }

  function normalizeOrderType(type) {
    return String(type || "").replace("_", "-").toLowerCase();
  }

  function getOrderStatus(order) {
    return String(order.status || "").toLowerCase();
  }

  function getPaymentMethod(order) {
    return String(order.payment_method || order.paymentMethod || "").toLowerCase();
  }

  function getCustomerName(order) {
    return (
      order.customer_name ||
      order.customerName ||
      order.customer?.name ||
      "-"
    );
  }

  function getTableNumber(order) {
    return order.table_number ?? order.tableNumber ?? order.tableNo ?? null;
  }

  function getCreatedAt(order) {
    return order.createdAt || order.created_at || null;
  }

  function formatDate(value) {
    if (!value) return "-";

    try {
      const date =
        typeof value?.toDate === "function" ? value.toDate() : new Date(value);

      if (Number.isNaN(date.getTime())) return "-";

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  }

  function escapeCsv(value) {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function exportOrdersToCsv() {
    if (!orders.length) {
      toast.error("No orders available to export");
      return;
    }

    const rows = [
      [
        "Order Number",
        "Date Time",
        "Customer",
        "Order Type",
        "Table Number",
        "Payment Method",
        "Status",
        "Subtotal",
        "Service Charge",
        "Total",
      ],
      ...orders.map((order) => [
        getOrderNumber(order),
        formatDate(getCreatedAt(order)),
        getCustomerName(order),
        getOrderType(order),
        getTableNumber(order) ?? "",
        getPaymentMethod(order),
        getOrderStatus(order),
        order.subtotal ?? 0,
        order.service_charge_amount ?? order.serviceChargeAmount ?? order.serviceCharge ?? 0,
        order.total ?? 0,
      ]),
    ];

    const csvContent = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `order-history-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  }

  async function handleViewReceipt(orderId) {
    setLoadingReceipt(true);

    const { data, error: receiptError } = await getReceiptData(orderId);

    if (receiptError) {
      toast.error("Failed to load receipt. Please try again.");
      console.error("Receipt fetch error:", receiptError);
    } else {
      setReceiptData(data);
      setShowCustomerReceiptModal(true);
    }

    setLoadingReceipt(false);
  }

  async function handleMarkPaid(orderId, paymentMethod) {
    const { closeOrderAsPaid } = await import("../services/orderService");
    const { error } = await closeOrderAsPaid(orderId, paymentMethod);

    if (error) {
      toast.error("Failed to mark order as paid.");
      return;
    }

    toast.success("Order marked as paid!");
    loadOrders(true);
  }

  async function handleDeleteOrder(orderId, orderNumber) {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete Order #${orderNumber}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { deleteOrder } = await import("../services/orderService");
      const { error } = await deleteOrder(orderId);

      if (error) throw error;

      toast.success(`Order #${orderNumber} deleted successfully`);
      loadOrders(true);
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error("Failed to delete order: " + err.message);
    }
  }

  async function handlePrintCustomer() {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      const receiptHtml = document.querySelector(".customer-receipt")?.outerHTML;

      if (!receiptHtml) {
        setPrintError("Receipt content not found. Please try again.");
        setShowPrintError(true);
        return;
      }

      if (customerPrinter === "Browser Print (window.print)") {
        window.print();
        lastPrintedRef.current = "customer";
        setPrintConfirmMessage("Customer receipt sent to printer");
        setShowPrintConfirm(true);
      } else if (customerPrinter) {
        const result = await printerService.print(customerPrinter, receiptHtml);

        lastPrintedRef.current = "customer";
        setPrintConfirmMessage(
          result?.success
            ? "✓ Customer receipt sent to Cashier printer"
            : "Customer receipt sent to printer"
        );
        setShowPrintConfirm(true);
      } else {
        setPrintError("No printer configured. Please configure a printer in admin settings.");
        setShowPrintError(true);
      }
    } catch (err) {
      console.error("Print error:", err);
      setPrintError(`Printing cancelled. ${err.message}`);
      setShowPrintError(true);
    } finally {
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 100);
    }
  }

  async function handlePrintKitchen() {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      const slipHtml = document.querySelector(".kitchen-slip")?.outerHTML;

      if (!slipHtml) {
        setPrintError("Kitchen slip content not found. Please try again.");
        setShowPrintError(true);
        return;
      }

      if (kitchenPrinter === "Browser Print (window.print)") {
        window.print();
        lastPrintedRef.current = "kitchen";
        setPrintConfirmMessage("Kitchen slip sent to printer");
        setShowPrintConfirm(true);
      } else if (kitchenPrinter) {
        const result = await printerService.print(kitchenPrinter, slipHtml);

        lastPrintedRef.current = "kitchen";
        setPrintConfirmMessage(
          result?.success
            ? "✓ Kitchen slip sent to Kitchen printer"
            : "Kitchen slip sent to printer"
        );
        setShowPrintConfirm(true);
      } else {
        setPrintError("No printer configured. Please configure a printer in admin settings.");
        setShowPrintError(true);
      }
    } catch (err) {
      console.error("Print error:", err);
      setPrintError(`Printing cancelled. ${err.message}`);
      setShowPrintError(true);
    } finally {
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 100);
    }
  }

  function handleCloseCustomerReceipt() {
    setShowCustomerReceiptModal(false);
    setShowKitchenReceiptModal(true);
  }

  function handleCloseKitchenReceipt() {
    setShowKitchenReceiptModal(false);
    setReceiptData(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-gray-600">Loading order history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Button
            onClick={() => navigate(dashboardPath)}
            className={`${theme.bg} ${theme.hover} text-white px-4 py-2`}
          >
            ← Go Back
          </Button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing {orders.length} order{orders.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => loadOrders(true)}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2"
            >
              Refresh
            </Button>

            <Button
              onClick={exportOrdersToCsv}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found</p>
            <p className="text-gray-400 mt-2">Orders will appear here once created</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-250px)] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const orderNumber = getOrderNumber(order);
                      const orderType = normalizeOrderType(getOrderType(order));
                      const status = getOrderStatus(order);
                      const paymentMethod = getPaymentMethod(order);
                      const tableNumber = getTableNumber(order);

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {orderNumber}
                            {orderType === "dine-in" && (
                              <span className="ml-2 px-2 py-1 text-xs rounded bg-teal-50 text-teal-700 font-semibold">
                                Dine-In
                              </span>
                            )}
                            {orderType === "take-away" && (
                              <span className="ml-2 px-2 py-1 text-xs rounded bg-orange-50 text-orange-700 font-semibold">
                                Take Away
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(getCreatedAt(order))}
                            {orderType === "dine-in" && tableNumber && (
                              <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                                Table #{tableNumber}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getCustomerName(order)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                paymentMethod === "cash"
                                  ? "bg-green-100 text-green-800"
                                  : paymentMethod === "card"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {paymentMethod?.toUpperCase() ||
                                (status === "open" ? "OPEN" : status?.toUpperCase() || "-")}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(order.total || 0)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleViewReceipt(order.id)}
                                disabled={loadingReceipt}
                                className={`${theme.bg} ${theme.hover} text-white px-4 py-2 text-sm`}
                              >
                                {loadingReceipt ? "Loading..." : "View Receipt"}
                              </Button>

                              {orderType === "dine-in" &&
                              (status === "open" || status === "pending") ? (
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    onClick={() => handleMarkPaid(order.id, "cash")}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-xs"
                                  >
                                    Mark Paid (Cash)
                                  </Button>
                                  <Button
                                    onClick={() => handleMarkPaid(order.id, "card")}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs"
                                  >
                                    Mark Paid (Card)
                                  </Button>
                                </div>
                              ) : (
                                role === "admin" &&
                                status !== "open" &&
                                status !== "pending" && (
                                  <Button
                                    onClick={() => handleDeleteOrder(order.id, orderNumber)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-xs"
                                  >
                                    Delete Order
                                  </Button>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              {hasMore ? (
                <Button
                  onClick={() => loadOrders(false)}
                  disabled={loadingMore}
                  className={`${theme.bg} ${theme.hover} text-white px-6 py-3`}
                >
                  {loadingMore ? "Loading more..." : "Load More Orders"}
                </Button>
              ) : (
                <p className="text-sm text-gray-500">No more orders to load</p>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showCustomerReceiptModal}
        onClose={handleCloseCustomerReceipt}
        title="Customer Receipt"
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          <div className="mb-6 border border-gray-200 rounded">
            <CustomerReceipt receiptData={receiptData} settings={settings} />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCloseCustomerReceipt} className="flex-1">
              Skip Print
            </Button>
            <Button
              variant="primary"
              onClick={handlePrintCustomer}
              className={`flex-1 ${theme.bg} ${theme.hover} text-white`}
            >
              Print Customer Receipt
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showKitchenReceiptModal}
        onClose={handleCloseKitchenReceipt}
        title="Kitchen Slip"
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          <div className="mb-6 border border-gray-200 rounded">
            <KitchenReceipt receiptData={receiptData} />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCloseKitchenReceipt} className="flex-1">
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handlePrintKitchen}
              className={`flex-1 ${theme.bg} ${theme.hover} text-white`}
            >
              Print Kitchen Slip
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPrintConfirm}
        onClose={() => {
          setShowPrintConfirm(false);
          handleCloseKitchenReceipt();
        }}
        title="Print Confirmation"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800">{printConfirmMessage}</p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setShowPrintConfirm(false);

              if (lastPrintedRef.current === "customer") {
                setShowCustomerReceiptModal(false);
                setShowKitchenReceiptModal(true);
                lastPrintedRef.current = null;
              } else if (lastPrintedRef.current === "kitchen") {
                handleCloseKitchenReceipt();
                lastPrintedRef.current = null;
              }
            }}
            className={`w-full ${theme.bg} ${theme.hover} text-white`}
          >
            Continue
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showPrintError}
        onClose={() => setShowPrintError(false)}
        title="Printing Cancelled"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800">{printError}</p>
          </div>

          <Button
            variant="primary"
            onClick={() => setShowPrintError(false)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            OK
          </Button>
        </div>
      </Modal>
    </div>
  );
}