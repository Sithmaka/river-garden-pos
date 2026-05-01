// WaiterOrderEntry.jsx
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { useMenu } from "../hooks/useMenu";
import { usePrinterConfiguration } from "../hooks/usePrinterConfiguration";
import { printerService } from "../services/printerService";
import { formatCurrency } from "../utils/formatting";
import { getSettings } from "../services/settingsService";
import {
  submitOrder,
  addItemsToOrder,
  updateItemQuantityInOrder,
  removeItemFromOrder,
  closeOrderAsPaid,
  getOrderById,
} from "../services/orderService";
import { getReceiptData } from "../services/receiptService";

import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import KitchenReceipt from "../components/cashier/KitchenReceipt";
import CustomerReceipt from "../components/cashier/CustomerReceipt";

/**
 * Waiter Order Entry – Firebase Version
 *
 * Fixed for Firestore order structure:
 * - existing order items are read from orders.items
 * - uses Firebase orderService directly
 * - avoids NaN by normalizing old item field names
 * - updates quantities/removals against embedded order items collection model
 * - supports kitchen print + final dine-in checkout
 */
export default function WaiterOrderEntry() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { menuItems, loading, error } = useMenu(true);
  const { kitchenPrinter, customerPrinter } = usePrinterConfiguration();

  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const [existingOrder, setExistingOrder] = useState(null);
  const [editableExistingItems, setEditableExistingItems] = useState([]);

  const [orderItems, setOrderItems] = useState([]);
  const [tableNumber, setTableNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [showKitchenReceiptModal, setShowKitchenReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishSubmitting, setFinishSubmitting] = useState(false);
  const [finishError, setFinishError] = useState(null);

  const [showCustomerReceiptModal, setShowCustomerReceiptModal] =
    useState(false);

  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printConfirmMessage, setPrintConfirmMessage] = useState("");

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeConfirmItem, setRemoveConfirmItem] = useState(null);

  const [showQuantityConfirm, setShowQuantityConfirm] = useState(false);
  const [quantityConfirmData, setQuantityConfirmData] = useState(null);

  const isPrintingRef = useRef(false);

  function normalizeExistingItem(item = {}, index = 0) {
    return {
      id:
        item.id ||
        item.menu_item_id ||
        item.menuItemId ||
        `existing-${index}-${item.name || item.menu_item_name || "item"}`,
      name: item.name || item.menu_item_name || item.menuItemName || "Unnamed",
      price: Number(item.price ?? item.unit_price ?? item.unitPrice ?? 0),
      quantity: Number(item.quantity ?? 0),
      line_total: Number(
        item.line_total ??
          item.lineTotal ??
          (Number(item.price ?? item.unit_price ?? 0) *
            Number(item.quantity ?? 0))
      ),
      ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    };
  }

  useEffect(() => {
    async function loadInitialData() {
      const { data, error } = await getSettings();
      setSettings(error ? { table_count: 10 } : data || { table_count: 10 });

      if (orderId) {
        const { data: order, error: orderError } = await getOrderById(orderId);

        if (!orderError && order) {
          setExistingOrder(order);
          setTableNumber(order.table_number ? String(order.table_number) : "");

          const normalizedItems = Array.isArray(order.items)
            ? order.items.map((item, idx) => normalizeExistingItem(item, idx))
            : [];

          setEditableExistingItems(normalizedItems);
          setOrderItems([]);
        }
      }
    }

    loadInitialData();
  }, [orderId]);

  const categories = useMemo(() => {
    if (!menuItems?.length) return [];

    return menuItems
      .filter((item) => item.category)
      .map((item) => item.category)
      .filter(
        (cat, index, self) => index === self.findIndex((c) => c.id === cat.id)
      )
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [menuItems]);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  const filteredItems = useMemo(() => {
    if (!menuItems || !activeCategory) return [];
    return menuItems.filter((item) => {
      const available = item.isAvailable ?? item.is_available ?? true;
      return item.category?.name === activeCategory && available;
    });
  }, [menuItems, activeCategory]);

  const existingSubtotal = useMemo(() => {
    return editableExistingItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [editableExistingItems]);

  const newItemsSubtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [orderItems]);

  function addToOrder(item) {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ];
    });

    toast.success(`Added ${item.name}`, { duration: 1200 });
  }

  function removeFromOrder(itemId) {
    setOrderItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.success("Item removed", { duration: 1000 });
  }

  function decreaseQuantity(itemId) {
    setOrderItems((prev) => {
      const found = prev.find((i) => i.id === itemId);
      if (!found) return prev;

      if (found.quantity <= 1) {
        return prev.filter((i) => i.id !== itemId);
      }

      return prev.map((i) =>
        i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }

  function increaseQuantity(itemId) {
    setOrderItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }

  function decreaseExistingQuantity(itemId) {
    const found = editableExistingItems.find((i) => i.id === itemId);
    if (!found) return;

    setQuantityConfirmData({
      itemId,
      itemName: found.name,
      currentQuantity: found.quantity,
      newQuantity: found.quantity - 1,
      action: "decrease",
    });
    setShowQuantityConfirm(true);
  }

  function increaseExistingQuantity(itemId) {
    const found = editableExistingItems.find((i) => i.id === itemId);
    if (!found) return;

    setQuantityConfirmData({
      itemId,
      itemName: found.name,
      currentQuantity: found.quantity,
      newQuantity: found.quantity + 1,
      action: "increase",
    });
    setShowQuantityConfirm(true);
  }

  async function confirmQuantityChange() {
    if (!quantityConfirmData || !orderId) return;

    const { itemId, currentQuantity, newQuantity, action } = quantityConfirmData;

    try {
      if (newQuantity <= 0) {
        const { error } = await removeItemFromOrder(
          orderId,
          itemId,
          settings?.service_charge_percentage ?? 0
        );

        if (error) {
          toast.error(error.message || "Failed to remove item");
          return;
        }

        setEditableExistingItems((prev) => prev.filter((i) => i.id !== itemId));
        toast.success("Item removed", { duration: 1000 });
      } else {
        setEditableExistingItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, quantity: newQuantity } : i
          )
        );

        const { error } = await updateItemQuantityInOrder(
          orderId,
          itemId,
          newQuantity,
          settings?.service_charge_percentage ?? 0
        );

        if (error) {
          setEditableExistingItems((prev) =>
            prev.map((i) =>
              i.id === itemId ? { ...i, quantity: currentQuantity } : i
            )
          );
          toast.error(error.message || "Failed to update quantity");
          return;
        }

        toast.success(
          action === "increase" ? "Quantity increased" : "Quantity reduced",
          { duration: 1000 }
        );
      }

      const refreshed = await getOrderById(orderId);
      if (refreshed.data) {
        setExistingOrder(refreshed.data);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity");
      setEditableExistingItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, quantity: currentQuantity } : i
        )
      );
    } finally {
      setShowQuantityConfirm(false);
      setQuantityConfirmData(null);
    }
  }

  function removeExistingItem(itemId, itemName) {
    setRemoveConfirmItem({ id: itemId, name: itemName });
    setShowRemoveConfirm(true);
  }

  async function confirmRemoveExistingItem() {
    if (!removeConfirmItem || !orderId) return;

    try {
      const { error } = await removeItemFromOrder(
        orderId,
        removeConfirmItem.id,
        settings?.service_charge_percentage ?? 0
      );

      if (error) {
        toast.error(error.message || "Failed to remove item");
        return;
      }

      setEditableExistingItems((prev) =>
        prev.filter((i) => i.id !== removeConfirmItem.id)
      );

      const refreshed = await getOrderById(orderId);
      if (refreshed.data) {
        setExistingOrder(refreshed.data);
      }

      toast.success("Item removed", { duration: 1000 });
    } catch (err) {
      console.error("Error removing item:", err);
      toast.error("Failed to remove item");
    } finally {
      setShowRemoveConfirm(false);
      setRemoveConfirmItem(null);
    }
  }

  async function handleSubmitToKitchen() {
    setSubmitting(true);
    setSubmitError(null);

    if (!tableNumber || isNaN(Number(tableNumber))) {
      setSubmitError("Please select a valid table number.");
      setSubmitting(false);
      return;
    }

    if (!orderItems.length) {
      setSubmitError('Please add items to the "Items to Add" list.');
      setSubmitting(false);
      return;
    }

    try {
      if (orderId && existingOrder) {
        const { data, error } = await addItemsToOrder(
          orderId,
          orderItems,
          settings?.service_charge_percentage ?? 0
        );

        if (error) throw error;

        toast.success("Items sent to kitchen!");
        setOrderItems([]);

        const { data: receipt, error: receiptError } = await getReceiptData(
          orderId
        );

        if (!receiptError && receipt) {
          setReceiptData(receipt);
          setShowKitchenReceiptModal(true);
        }

        if (data) {
          setExistingOrder(data);
          const refreshedItems = Array.isArray(data.items)
            ? data.items.map((item, idx) => normalizeExistingItem(item, idx))
            : [];
          setEditableExistingItems(refreshedItems);
        }
      } else {
        const subtotal = newItemsSubtotal;

        const orderData = {
          order_type: "dine-in",
          table_number: Number(tableNumber),
          subtotal,
          service_charge_amount:
            Math.round(
              subtotal *
                ((settings?.service_charge_percentage ?? 0) / 100) *
                100
            ) / 100,
          total:
            Math.round(
              (subtotal +
                subtotal * ((settings?.service_charge_percentage ?? 0) / 100)) *
                100
            ) / 100,
          payment_method: "pending",
          status: "pending",
        };

        const { data, error } = await submitOrder(
          orderData,
          orderItems,
          settings?.service_charge_percentage ?? 0
        );

        if (error) throw error;

        toast.success("Order sent to kitchen!");
        setOrderItems([]);

        if (data?.id) {
          const { data: receipt, error: receiptError } = await getReceiptData(
            data.id
          );

          if (!receiptError && receipt) {
            setReceiptData(receipt);
            setShowKitchenReceiptModal(true);
          }

          navigate(`/waiter/order/${data.id}`, { replace: true });
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(err.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinishDineIn() {
    if (!orderId) return;

    setFinishSubmitting(true);
    setFinishError(null);

    try {
      const { data: receipt, error } = await getReceiptData(orderId);

      if (error || !receipt) {
        setFinishError("Failed to fetch receipt data.");
        toast.error("Failed to fetch receipt data.");
        return;
      }

      setReceiptData(receipt);
      setShowCustomerReceiptModal(true);
    } catch (err) {
      console.error("Finish dine-in error:", err);
      setFinishError("Failed to fetch receipt data.");
      toast.error("Failed to fetch receipt data.");
    } finally {
      setFinishSubmitting(false);
    }
  }

  function handleCloseCustomerReceipt() {
    setShowCustomerReceiptModal(false);
    setShowFinishModal(true);
  }

  async function handleConfirmFinish(paymentMethod = "cash") {
    if (!orderId) return;

    setFinishSubmitting(true);
    setFinishError(null);

    try {
      const { error } = await closeOrderAsPaid(orderId, paymentMethod);

      if (error) {
        setFinishError(error.message || "Failed to mark order as paid.");
        toast.error(error.message || "Failed to mark order as paid.");
        setShowFinishModal(true);
        return;
      }

      toast.success("Order marked as paid!");
      setShowCustomerReceiptModal(false);
      setShowFinishModal(false);
      navigate("/cashier/dashboard");
    } catch (err) {
      console.error("Finish payment error:", err);
      setFinishError("Failed to mark order as paid.");
      toast.error("Failed to mark order as paid.");
      setShowFinishModal(true);
    } finally {
      setFinishSubmitting(false);
    }
  }

  async function handlePrintKitchen() {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      const slipHtml = document.querySelector(".kitchen-slip")?.outerHTML;
      if (!slipHtml) {
        toast.error("Kitchen slip content not found.");
        return;
      }

      if (kitchenPrinter === "Browser Print (window.print)") {
        window.print();
        toast.success("Kitchen slip sent to printer!");
      } else if (kitchenPrinter) {
        const result = await printerService.print(kitchenPrinter, slipHtml);
        if (result?.success) {
          toast.success("Kitchen slip sent to Kitchen printer!");
        } else {
          toast.success("Kitchen slip sent to printer!");
        }
      } else {
        toast.error(
          "No printer configured. Please configure a printer in admin settings."
        );
      }
    } catch (error) {
      console.error("Print kitchen error:", error);
      toast.error(`Print failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 100);
    }
  }

  async function handlePrintCustomerReceipt() {
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;

    try {
      const receiptHtml = document.querySelector(".customer-receipt")?.outerHTML;
      if (!receiptHtml) {
        toast.error("Receipt content not found.");
        return;
      }

      if (customerPrinter === "Browser Print (window.print)") {
        window.print();
        setPrintConfirmMessage("✓ Customer receipt sent to printer");
        setShowPrintConfirm(true);
      } else if (customerPrinter) {
        const result = await printerService.print(customerPrinter, receiptHtml);
        setPrintConfirmMessage(
          result?.success
            ? "✓ Customer receipt sent to Cashier printer"
            : "Customer receipt sent to printer"
        );
        setShowPrintConfirm(true);
      } else {
        toast.error(
          "No printer configured. Please configure a printer in admin settings."
        );
      }
    } catch (error) {
      console.error("Print customer error:", error);
      toast.error(`Print failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        isPrintingRef.current = false;
      }, 100);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading menu…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Failed to load menu
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-start">
        <Button
          onClick={() => navigate("/cashier/dashboard")}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2"
        >
          ← Go Back
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">
          {orderId ? `Update Order #${orderId}` : "New Dine-In Order"}
        </h1>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table Number
          </label>

          {orderId ? (
            !existingOrder ? (
              <div className="w-32 px-3 py-2 border rounded-md text-center bg-gray-100 italic text-gray-400">
                Loading…
              </div>
            ) : (
              <div className="w-32 px-3 py-2 border rounded-md bg-gray-100 text-gray-700 flex items-center justify-center mx-auto">
                {existingOrder.table_number}
              </div>
            )
          ) : (
            <input
              type="number"
              min={1}
              max={settings?.table_count ?? 10}
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-32 px-3 py-2 border rounded-md text-center border-gray-300 focus:ring-teal-500 focus:outline-none focus:ring-2"
              placeholder={`1-${settings?.table_count ?? 10}`}
            />
          )}
        </div>

        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors min-h-[44px] ${
                  activeCategory === cat.name
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
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
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-bold mb-2">Items to Add</h2>
          {orderItems.length === 0 ? (
            <p className="text-gray-500">No items selected yet</p>
          ) : (
            <ul className="space-y-3">
              {orderItems.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium">{it.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => decreaseQuantity(it.id)}
                        className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold">
                        x {it.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(it.id)}
                        className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold hover:bg-teal-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-teal-600">
                      {formatCurrency(
                        Number(it.price || 0) * Number(it.quantity || 0)
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromOrder(it.id)}
                    className="ml-3 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {submitError && <div className="mb-4 text-red-600">{submitError}</div>}

        <Button
          onClick={handleSubmitToKitchen}
          disabled={submitting || !orderItems.length || !tableNumber}
          className="w-full py-4 text-lg font-semibold bg-teal-600 hover:bg-teal-700 text-white"
        >
          {submitting ? "Submitting…" : "Send to Kitchen"}
        </Button>

        {orderId && existingOrder && (
          <div className="my-10">
            <hr className="border-t-2 border-gray-300 mb-8" />

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Already Ordered
              </label>

              {editableExistingItems.length === 0 ? (
                <div className="text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
                  No items in this order
                </div>
              ) : (
                <ul className="space-y-2">
                  {editableExistingItems.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between text-gray-700 bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{it.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => decreaseExistingQuantity(it.id)}
                            className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold hover:bg-gray-300"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold">
                            x {it.quantity}
                          </span>
                          <button
                            onClick={() => increaseExistingQuantity(it.id)}
                            className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold hover:bg-teal-200"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-teal-600">
                          {formatCurrency(
                            Number(it.price || 0) * Number(it.quantity || 0)
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => removeExistingItem(it.id, it.name)}
                        className="ml-3 text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-between items-center text-gray-700 bg-white p-3 rounded-lg border border-gray-200 mt-3 font-semibold">
                <span>Subtotal:</span>
                <span className="text-teal-600">
                  {formatCurrency(existingSubtotal)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleFinishDineIn}
              disabled={finishSubmitting}
              className="w-full py-3 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
            >
              {finishSubmitting ? "Loading…" : "Finish Dine-In & Checkout"}
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={showKitchenReceiptModal}
        onClose={() => {
          setShowKitchenReceiptModal(false);
          navigate("/cashier/dashboard");
        }}
        title="Kitchen Slip"
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          <div className="mb-6 border border-gray-200 rounded">
            <KitchenReceipt receiptData={receiptData} />
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handlePrintKitchen}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Print Kitchen Slip
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowKitchenReceiptModal(false);
                navigate("/cashier/dashboard");
              }}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title="Select Payment Method"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <p className="mb-4">How did the client pay?</p>
          <div className="flex gap-3">
            <Button
              onClick={() => handleConfirmFinish("cash")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={finishSubmitting}
            >
              Cash
            </Button>
            <Button
              onClick={() => handleConfirmFinish("card")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={finishSubmitting}
            >
              Card
            </Button>
          </div>
          {finishError && <p className="text-red-600 mt-3">{finishError}</p>}
        </div>
      </Modal>

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
              variant="primary"
              onClick={handleCloseCustomerReceipt}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Payment Method
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintCustomerReceipt}
              className="flex-1"
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPrintConfirm}
        onClose={() => setShowPrintConfirm(false)}
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
            onClick={() => setShowPrintConfirm(false)}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            Continue
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showRemoveConfirm}
        onClose={() => {
          setShowRemoveConfirm(false);
          setRemoveConfirmItem(null);
        }}
        title="Confirm Removal"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700">
              Are you sure you want to remove{" "}
              <strong>{removeConfirmItem?.name}</strong> from the order?
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRemoveConfirm(false);
                setRemoveConfirmItem(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmRemoveExistingItem}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showQuantityConfirm}
        onClose={() => {
          setShowQuantityConfirm(false);
          setQuantityConfirmData(null);
        }}
        title="Confirm Quantity Change"
        maxWidth="max-w-md"
      >
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-3">
              <strong>{quantityConfirmData?.itemName}</strong>
            </p>
            <p className="text-gray-600">
              Change quantity from{" "}
              <span className="font-semibold">
                {quantityConfirmData?.currentQuantity}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-teal-600">
                {quantityConfirmData?.newQuantity}
              </span>
              ?
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowQuantityConfirm(false);
                setQuantityConfirmData(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmQuantityChange}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}