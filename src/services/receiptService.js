import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * @typedef {Object} ReceiptLineItem
 * @property {string} id - Menu item id
 * @property {string} name - Item name
 * @property {number} quantity - Quantity ordered
 * @property {number} unitPrice - Price per unit
 * @property {number} lineTotal - Total for this line
 */

/**
 * @typedef {Object} ReceiptData
 * @property {string} id
 * @property {string} orderNumber
 * @property {string|null} timestamp
 * @property {string|null} customerName
 * @property {string|null} customerPhone
 * @property {string|null} specialInstructions
 * @property {string} paymentMethod
 * @property {ReceiptLineItem[]} items
 * @property {string[]} itemIds
 * @property {number} subtotal
 * @property {number} serviceChargePercent
 * @property {number} serviceChargeAmount
 * @property {number} total
 * @property {string|null} orderType
 * @property {number|null} tableNumber
 */

/**
 * Convert Firestore timestamp / Date / string into ISO string
 */
function toIsoString(value) {
  if (!value) return null;

  try {
    if (typeof value?.toDate === "function") {
      return value.toDate().toISOString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === "string") {
      return value;
    }

    return null;
  } catch (error) {
    console.warn("Failed to convert timestamp:", error);
    return null;
  }
}

/**
 * Fetch complete receipt data for a given order ID
 * @param {string} orderId
 * @returns {Promise<{data: ReceiptData|null, error: any}>}
 */
export async function getReceiptData(orderId) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data();
    const rawItems = Array.isArray(order.items) ? order.items : [];

    const items = rawItems.map((item, index) => ({
      id: item.id || `item-${index}`,
      name: item.name || "",
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.price ?? item.unitPrice ?? 0),
      lineTotal: Number(
        item.line_total ??
          item.lineTotal ??
          (Number(item.price ?? item.unitPrice ?? 0) *
            Number(item.quantity ?? 0))
      ),
    }));

    const receiptData = {
      id: orderSnap.id,
      orderNumber: order.orderNumber || order.order_number || "",
      timestamp: toIsoString(order.createdAt || order.created_at || null),
      customerName: order.customer_name || order.customerName || null,
      customerPhone: order.customer_phone || order.customerPhone || null,
      specialInstructions:
        order.special_instructions || order.specialInstructions || null,
      paymentMethod: order.payment_method || order.paymentMethod || "cash",
      items,
      itemIds: items.map((item) => item.id),
      subtotal: Number(order.subtotal) || 0,
      serviceChargePercent:
        Number(
          order.service_charge_percent ?? order.serviceChargePercent ?? 0
        ) || 0,
      serviceChargeAmount:
        Number(
          order.service_charge_amount ?? order.serviceChargeAmount ?? 0
        ) || 0,
      total: Number(order.total) || 0,
      orderType: order.order_type || order.orderType || null,
      tableNumber:
        order.table_number !== undefined && order.table_number !== null
          ? Number(order.table_number)
          : order.tableNumber !== undefined && order.tableNumber !== null
          ? Number(order.tableNumber)
          : null,
    };

    return { data: receiptData, error: null };
  } catch (error) {
    console.error("Error fetching receipt data:", error);
    return { data: null, error };
  }
}