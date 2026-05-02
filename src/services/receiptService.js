import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { getOfflineOrders } from "./orderService";

function toIsoString(value) {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") return value.toDate().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    return null;
  } catch {
    return null;
  }
}

function normalizeReceiptData(order, id) {
  const rawItems = Array.isArray(order.items) ? order.items : [];

  const items = rawItems.map((item, index) => {
    const quantity = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = Number(item.price ?? item.unitPrice ?? 0);

    return {
      id: item.id || item.menuId || `item-${index}`,
      name: item.name || "",
      quantity,
      unitPrice,
      lineTotal: Number(item.line_total ?? item.lineTotal ?? unitPrice * quantity),
    };
  });

  return {
    id,
    orderNumber: order.orderNumber || order.order_number || "",
    timestamp: toIsoString(order.createdAt || order.created_at || order.paid_at || null),
    customerName: order.customer_name || order.customerName || null,
    customerPhone: order.customer_phone || order.customerPhone || null,
    specialInstructions:
      order.special_instructions || order.specialInstructions || null,
    paymentMethod: order.payment_method || order.paymentMethod || "cash",
    items,
    itemIds: items.map((item) => item.id),
    subtotal: Number(order.subtotal) || 0,
    serviceChargePercent:
      Number(order.service_charge_percent ?? order.serviceChargePercent ?? 0) || 0,
    serviceChargeAmount:
      Number(order.service_charge_amount ?? order.serviceChargeAmount ?? 0) || 0,
    total: Number(order.total) || 0,
    orderType: order.order_type || order.orderType || null,
    tableNumber:
      order.table_number !== undefined && order.table_number !== null
        ? Number(order.table_number)
        : order.tableNumber !== undefined && order.tableNumber !== null
        ? Number(order.tableNumber)
        : null,
    isOffline: Boolean(order.isOffline),
    syncStatus: order.syncStatus || null,
  };
}

export async function getReceiptData(orderId) {
  try {
    if (String(orderId).startsWith("offline_")) {
      const offlineOrder = getOfflineOrders().find(
        (order) =>
          order.id === orderId ||
          order.localId === orderId ||
          order.orderNumber === orderId
      );

      if (!offlineOrder) throw new Error("Offline receipt not found");

      return {
        data: normalizeReceiptData(offlineOrder, offlineOrder.id || orderId),
        error: null,
      };
    }

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) throw new Error("Order not found");

    return {
      data: normalizeReceiptData(orderSnap.data(), orderSnap.id),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching receipt data:", error);
    return { data: null, error };
  }
}