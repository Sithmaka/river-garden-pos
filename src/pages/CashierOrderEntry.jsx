import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMenu } from "../hooks/useMenu";
import { usePrinterConfiguration } from "../hooks/usePrinterConfiguration";
import { printerService } from "../services/printerService";
import { formatCurrency } from "../utils/formatting";
import { getSettings } from "../services/settingsService";
import { submitOrder } from "../services/orderService";
import { getReceiptData } from "../services/receiptService";
import toast, { Toaster } from "react-hot-toast";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import CustomerReceipt from "../components/cashier/CustomerReceipt";
import KitchenReceipt from "../components/cashier/KitchenReceipt";

export default function CashierOrderEntry() {
  const navigate = useNavigate();
  const { menuItems, loading, error } = useMenu(true);
  const { customerPrinter, kitchenPrinter } = usePrinterConfiguration();

  const [activeCategory, setActiveCategory] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [settings, setSettings] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const [showCustomerReceiptModal, setShowCustomerReceiptModal] = useState(false);
  const [showKitchenReceiptModal, setShowKitchenReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printConfirmMessage, setPrintConfirmMessage] = useState("");
  const [printError, setPrintError] = useState(null);
  const [showPrintError, setShowPrintError] = useState(false);

  const [orderType, setOrderType] = useState("take-away");
  const [tableNumber, setTableNumber] = useState("");

  const [showDineInModal, setShowDineInModal] = useState(false);
  const [dineInSubmitting, setDineInSubmitting] = useState(false);
  const [dineInError, setDineInError] = useState(null);

  const isPrintingRef = useRef(false);
  const lastPrintedRef = useRef(null);

  const isCheckoutOrder = orderType === "take-away" || orderType === "delivery";

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await getSettings();

      if (error) {
        console.error("Failed to load settings:", error);
        setSettings({ service_charge_percentage: 10, currency_code: "LKR" });
      } else {
        setSettings(data || { service_charge_percentage: 10, currency_code: "LKR" });
      }
    }

    loadSettings();
  }, []);

  const categories = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];

    return menuItems
      .filter((item) => item.category)
      .map((item) => item.category)
      .filter(
        (cat, index, self) => index === self.findIndex((c) => c.id === cat.id)
      )
      .sort((a, b) => {
        const aOrder = a.sort_order ?? 999;
        const bOrder = b.sort_order ?? 999;
        return aOrder - bOrder;
      });
  }, [menuItems]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    if (!menuItems || !activeCategory) return [];

    return menuItems.filter((item) => {
      const isAvailable = item.isAvailable ?? item.is_available ?? true;
      return item.category?.name === activeCategory && isAvailable;
    });
  }, [menuItems, activeCategory]);

  function addToOrder(item) {
    setOrderItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (orderItem) => orderItem.id === item.id
      );

      if (existingIndex !== -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Number(updated[existingIndex].quantity || 0) + 1,
        };
        return updated;
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });

    const existingItem = orderItems.find((orderItem) => orderItem.id === item.id);

    toast.success(
      existingItem ? `Added another ${item.name}` : `Added ${item.name}`,
      {
        duration: 1500,
        id: `add-${item.id}`,
      }
    );
  }

  function clearOrder() {
    setOrderItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setSpecialInstructions("");
    setPaymentMethod("");
    setTableNumber("");
    setOrderType("take-away");
    setShowClearConfirm(false);
    toast.success("Order cleared");
  }

  function createTimeoutPromise(seconds) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), seconds * 1000)
    );
  }

  function buildReceiptFromSubmittedOrder(order) {
    if (!order) return null;

    const rawItems = Array.isArray(order.items) ? order.items : [];

    const items = rawItems.map((item, index) => {
      const quantity = Number(item.quantity ?? item.qty ?? 0);
      const unitPrice = Number(item.price ?? item.unitPrice ?? 0);

      return {
        id: item.id || item.menuId || `item-${index}`,
        name: item.name || "",
        quantity,
        unitPrice,
        lineTotal: Number(
          item.line_total ?? item.lineTotal ?? unitPrice * quantity
        ),
      };
    });

    return {
      id: order.id || order.orderId || `offline-${Date.now()}`,
      orderNumber:
        order.orderNumber ||
        order.order_number ||
        order.localOrderNumber ||
        `OFFLINE-${Date.now()}`,
      timestamp:
        typeof order.createdAt?.toDate === "function"
          ? order.createdAt.toDate().toISOString()
          : order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : new Date().toISOString(),
      customerName: order.customer_name || order.customerName || null,
      customerPhone: order.customer_phone || order.customerPhone || null,
      specialInstructions:
        order.special_instructions || order.specialInstructions || null,
      paymentMethod: order.payment_method || order.paymentMethod || paymentMethod || "cash",
      items,
      itemIds: items.map((item) => item.id),
      subtotal: Number(order.subtotal) || subtotal || 0,
      serviceChargePercent:
        Number(order.service_charge_percent ?? order.serviceChargePercent ?? 0) ||
        0,
      serviceChargeAmount:
        Number(order.service_charge_amount ?? order.serviceChargeAmount ?? 0) ||
        0,
      total: Number(order.total) || total || 0,
      orderType: order.order_type || order.orderType || orderType,
      tableNumber:
        order.table_number !== undefined && order.table_number !== null
          ? Number(order.table_number)
          : order.tableNumber !== undefined && order.tableNumber !== null
          ? Number(order.tableNumber)
          : orderType === "dine-in"
          ? Number(tableNumber)
          : null,
      isOffline: Boolean(order.isOffline),
      syncStatus: order.syncStatus || null,
    };
  }

  async function loadReceiptForSubmittedOrder(orderData) {
    if (!orderData?.id) {
      return buildReceiptFromSubmittedOrder(orderData);
    }

    try {
      const { data: receipt, error } = await getReceiptData(orderData.id);

      if (!error && receipt) {
        return receipt;
      }

      console.warn("Receipt fetch failed, using submitted order data:", error);
      return buildReceiptFromSubmittedOrder(orderData);
    } catch (err) {
      console.warn("Receipt fetch crashed, using submitted order data:", err);
      return buildReceiptFromSubmittedOrder(orderData);
    }
  }

  async function handleCheckout() {
    setSubmitting(true);
    setCheckoutError(null);

    const orderData = {
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      special_instructions: specialInstructions || null,
      subtotal,
      service_charge_amount: serviceChargeAmount,
      total,
      payment_method: paymentMethod,
      order_type: orderType,
      table_number: null,
    };

    const serviceChargePercent = settings?.service_charge_percentage || 10;

    setPendingOrderData({
      orderData,
      orderItems: [...orderItems],
      serviceChargePercent,
    });

    try {
      const { data, error } = await Promise.race([
        submitOrder(orderData, orderItems, serviceChargePercent),
        createTimeoutPromise(10),
      ]);

      if (error) {
        setCheckoutError(error.message || "Order submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const orderNumber = data?.orderNumber || data?.order_number || "Order";
      const receipt = await loadReceiptForSubmittedOrder(data);

      if (receipt) {
        setReceiptData(receipt);
        setShowCustomerReceiptModal(true);
      }

      toast.success(`${orderNumber} completed successfully!`);

      setOrderItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialInstructions("");
      setPaymentMethod("");
      setPendingOrderData(null);
      setCheckoutError(null);
      setShowCheckoutModal(false);
      setOrderType("take-away");
      setTableNumber("");
    } catch (err) {
      setCheckoutError(
        err.message === "TIMEOUT"
          ? "Order submission timed out. Please try again."
          : "Failed to submit order. Check internet connection."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    if (!pendingOrderData) return;

    setSubmitting(true);
    setCheckoutError(null);

    try {
      const { data, error } = await Promise.race([
        submitOrder(
          pendingOrderData.orderData,
          pendingOrderData.orderItems,
          pendingOrderData.serviceChargePercent
        ),
        createTimeoutPromise(10),
      ]);

      if (error) {
        setCheckoutError(error.message || "Order submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const orderNumber = data?.orderNumber || data?.order_number || "Order";
      const receipt = await loadReceiptForSubmittedOrder(data);

      if (receipt) {
        setReceiptData(receipt);
        setShowCustomerReceiptModal(true);
      }

      toast.success(`${orderNumber} completed successfully!`);

      setOrderItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialInstructions("");
      setPaymentMethod("");
      setPendingOrderData(null);
      setCheckoutError(null);
      setShowCheckoutModal(false);
      setOrderType("take-away");
      setTableNumber("");
    } catch (err) {
      setCheckoutError(
        err.message === "TIMEOUT"
          ? "Order submission timed out. Please try again."
          : "Failed to submit order. Check internet connection."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDineInConfirm() {
    setDineInSubmitting(true);
    setDineInError(null);

    const orderData = {
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      special_instructions: specialInstructions || null,
      subtotal,
      service_charge_amount: serviceChargeAmount,
      total,
      payment_method: "pending",
      order_type: "dine-in",
      table_number: parseInt(tableNumber, 10),
    };

    const serviceChargePercent = settings?.service_charge_percentage || 10;

    try {
      const { data, error } = await submitOrder(
        orderData,
        orderItems,
        serviceChargePercent
      );

      if (error) {
        setDineInError(error.message || "Failed to submit dine-in order.");
        setDineInSubmitting(false);
        return;
      }

      const receipt = await loadReceiptForSubmittedOrder(data);

      if (receipt) {
        setReceiptData(receipt);
        setShowKitchenReceiptModal(true);
      } else {
        setDineInError("Order created, but failed to prepare kitchen slip.");
      }

      setOrderItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setSpecialInstructions("");
      setPendingOrderData(null);
      setShowDineInModal(false);
      setTableNumber("");
      setOrderType("take-away");
    } catch {
      setDineInError("Network error.");
    } finally {
      setDineInSubmitting(false);
    }
  }

  async function handlePrintCustomer() {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      if (!customerPrinter) {
        setPrintError("No printer configured. Please configure a printer in admin settings.");
        setShowPrintError(true);
        return;
      }

      const receiptHtml = document.querySelector(".customer-receipt")?.outerHTML;

      if (!receiptHtml) {
        setPrintError("Receipt content not found. Please try again.");
        setShowPrintError(true);
        return;
      }

      await printerService.print(customerPrinter, receiptHtml, {
        paperSize: "Letter",
        orientation: "portrait",
      });

      lastPrintedRef.current = "customer";
      setPrintConfirmMessage("✓ Customer receipt sent to Cashier printer");
      setShowPrintConfirm(true);
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
      if (!kitchenPrinter) {
        setPrintError("No printer configured. Please configure a printer in admin settings.");
        setShowPrintError(true);
        return;
      }

      const slipHtml = document.querySelector(".kitchen-slip")?.outerHTML;

      if (!slipHtml) {
        setPrintError("Kitchen slip content not found. Please try again.");
        setShowPrintError(true);
        return;
      }

      await printerService.print(kitchenPrinter, slipHtml, {
        paperSize: "Letter",
        orientation: "portrait",
      });

      lastPrintedRef.current = "kitchen";
      setPrintConfirmMessage("✓ Kitchen slip sent to Kitchen printer");
      setShowPrintConfirm(true);
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

  function incrementQuantity(itemId) {
    setOrderItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Number(item.quantity || 0) + 1 }
          : item
      )
    );
  }

  function decrementQuantity(itemId) {
    const item = orderItems.find((i) => i.id === itemId);

    if (!item) return;

    if (Number(item.quantity) <= 1) {
      setItemToRemove(item);
      setShowRemoveConfirm(true);
    } else {
      setOrderItems((prevItems) =>
        prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity: Number(i.quantity || 0) - 1 } : i
        )
      );
    }
  }

  function removeItem() {
    if (!itemToRemove) return;

    setOrderItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemToRemove.id)
    );

    toast.success(`Removed ${itemToRemove.name}`);
    setShowRemoveConfirm(false);
    setItemToRemove(null);
  }

  const itemCount = orderItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const subtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
      return sum + lineTotal;
    }, 0);
  }, [orderItems]);

  const serviceChargeAmount = useMemo(() => {
    if (orderType !== "dine-in") return 0;
    if (!settings) return 0;

    const percentage = settings.service_charge_percentage || 0;
    const charge = subtotal * (percentage / 100);
    return Math.round(charge * 100) / 100;
  }, [subtotal, settings, orderType]);

  const total = useMemo(() => {
    return Math.round((subtotal + serviceChargeAmount) * 100) / 100;
  }, [subtotal, serviceChargeAmount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorText =
      typeof error === "string" ? error : error?.message || "Please try again later";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Failed to load menu</p>
          <p className="text-sm">{errorText}</p>
        </div>
      </div>
    );
  }

  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu is empty</h2>
          <p className="text-gray-600">Contact admin to add menu items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={() => navigate("/cashier/dashboard")}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2"
            >
              ← Go Back
            </Button>
          </div>
        </div>

        <div className="bg-teal-600 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">New Order</h1>
            <p className="text-teal-100 text-sm">Select items to add to order</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 min-w-max">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.name)}
                  className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                    activeCategory === category.name
                      ? "bg-teal-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24 lg:pb-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToOrder(item)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg cursor-pointer transition-all min-h-[120px] flex flex-col justify-between active:scale-95"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-teal-600 font-bold text-lg">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-96 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-300 shadow-lg fixed bottom-0 left-0 right-0 max-h-80 lg:max-h-none overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Current Order</h2>
              <p className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </p>
            </div>

            {orderItems.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Order Type</h3>

            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                  orderType === "take-away"
                    ? "border-teal-600 bg-teal-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => {
                  setOrderType("take-away");
                  setTableNumber("");
                }}
              >
                Take Away
              </button>

              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                  orderType === "delivery"
                    ? "border-teal-600 bg-teal-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => {
                  setOrderType("delivery");
                  setTableNumber("");
                }}
              >
                Delivery
              </button>

              <button
                type="button"
                className={`px-4 py-2 rounded-lg font-medium border-2 transition-colors ${
                  orderType === "dine-in"
                    ? "border-teal-600 bg-teal-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onClick={() => setOrderType("dine-in")}
              >
                Dine-In
              </button>
            </div>

            {orderType === "dine-in" && (
              <div className="mt-4">
                <label
                  htmlFor="tableNumber"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Table Number
                </label>
                <input
                  id="tableNumber"
                  type="number"
                  min={1}
                  max={settings?.table_count || 10}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-32 px-3 py-2 border rounded-md text-center border-gray-300 focus:ring-teal-500 focus:outline-none focus:ring-2"
                  placeholder={`1-${settings?.table_count || 10}`}
                />
              </div>
            )}
          </div>

          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Customer Info {orderType === "delivery" ? "(Recommended)" : "(Optional)"}
            </h3>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
              />

              <textarea
                placeholder={
                  orderType === "delivery"
                    ? "Delivery address / special instructions"
                    : "Special Instructions (Optional)"
                }
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base resize-none"
              />
            </div>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-500">No items added yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap menu items to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => {
                const lineTotal =
                  (Number(item.price) || 0) * (Number(item.quantity) || 0);

                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>

                      <div className="text-right ml-2">
                        <p className="font-bold text-teal-600">
                          {formatCurrency(lineTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrementQuantity(item.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-md border-2 border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100 transition-colors font-semibold text-lg"
                      >
                        −
                      </button>

                      <span className="text-lg font-semibold min-w-[3rem] text-center text-gray-900">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => incrementQuantity(item.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-md border-2 border-teal-600 text-teal-600 hover:bg-teal-50 active:bg-teal-100 transition-colors font-semibold text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="border-t border-gray-300 pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Service Charge (
                  {orderType === "dine-in"
                    ? settings?.service_charge_percentage || 0
                    : 0}
                  %)
                </span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(serviceChargeAmount)}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2 mt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-teal-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          {orderItems.length > 0 && isCheckoutOrder && (
            <div className="mt-6">
              <Button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full py-4 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                Complete Order
              </Button>
            </div>
          )}

          {orderItems.length > 0 && orderType === "dine-in" && (
            <div className="mt-6">
              <Button
                onClick={() => setShowDineInModal(true)}
                disabled={!tableNumber}
                className="w-full py-4 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white"
              >
                Confirm Dine-In & Print Kitchen Slip
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showDineInModal}
        onClose={() => setShowDineInModal(false)}
        title="Confirm Dine-In Order"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          {dineInError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-3">{dineInError}</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Table Number:</span>
              <span className="font-medium">{tableNumber}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span className="text-teal-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDineInModal(false)}
              disabled={dineInSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDineInConfirm}
              disabled={dineInSubmitting}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {dineInSubmitting ? "Submitting..." : "Confirm & Print Kitchen Slip"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCheckoutModal}
        onClose={() => {
          if (!submitting) {
            setShowCheckoutModal(false);
            setPaymentMethod("");
            setCheckoutError(null);
            setPendingOrderData(null);
          }
        }}
        title={orderType === "delivery" ? "Complete Delivery Order" : "Complete Order"}
        maxWidth="max-w-md"
      >
        <div className="p-6">
          {checkoutError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-3">{checkoutError}</p>
              <Button
                onClick={handleRetry}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting ? "Retrying..." : "Retry"}
              </Button>
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Order Type:</span>
              <span className="font-medium">
                {orderType === "delivery" ? "Delivery" : "Take Away"}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Items:</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-teal-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("cash")}
                disabled={submitting}
                className={`p-6 border-2 rounded-lg text-center transition-all ${
                  paymentMethod === "cash"
                    ? "border-teal-600 bg-teal-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-2">💵</div>
                <div className="font-medium">Cash</div>
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                disabled={submitting}
                className={`p-6 border-2 rounded-lg text-center transition-all ${
                  paymentMethod === "card"
                    ? "border-teal-600 bg-teal-50 shadow-md"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="text-4xl mb-2">💳</div>
                <div className="font-medium">Card</div>
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCheckoutModal(false);
                setPaymentMethod("");
              }}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCheckout}
              disabled={!paymentMethod || submitting}
              className="flex-1"
            >
              {submitting ? "Processing..." : "Complete & Print"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Order?"
        message="This will remove all items from the current order."
        confirmText="Clear Order"
        cancelText="Cancel"
        onConfirm={clearOrder}
        onClose={() => setShowClearConfirm(false)}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="Remove Item?"
        message={itemToRemove ? `Remove ${itemToRemove.name} from order?` : ""}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={removeItem}
        onClose={() => {
          setShowRemoveConfirm(false);
          setItemToRemove(null);
        }}
        variant="danger"
      />

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
            <Button
              variant="secondary"
              onClick={handleCloseCustomerReceipt}
              className="flex-1"
            >
              Skip Print
            </Button>
            <Button
              variant="primary"
              onClick={handlePrintCustomer}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
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
            <Button
              variant="secondary"
              onClick={handleCloseKitchenReceipt}
              className="flex-1"
            >
              Skip Print
            </Button>
            <Button
              variant="primary"
              onClick={handlePrintKitchen}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
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
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {printConfirmMessage}
            </p>
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
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
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
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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