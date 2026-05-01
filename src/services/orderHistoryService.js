/**
 * Order History Service (Firebase Version)
 * Handles order queries from Firestore
 */

import { db } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  getDocs,
  orderBy,
  limit as limitQuery,
  startAfter,
} from "firebase/firestore";

function normalizeOrder(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: docSnap.id,
    ...data,

    // compatibility fields for old UI code
    order_number: data.orderNumber || data.orderId || "",
    cashier_id: data.cashierId || "",
    created_at: data.createdAt || null,
    updated_at: data.updatedAt || null,
  };
}

async function attachCashier(order) {
  try {
    const cashierId = order.cashierId || order.cashier_id;
    if (!cashierId) return order;

    const cashierRef = doc(db, "users", cashierId);
    const cashierSnap = await getDoc(cashierRef);

    if (cashierSnap.exists()) {
      order.cashier = {
        email: cashierSnap.data().email || "",
      };
    }

    return order;
  } catch {
    return order;
  }
}

/**
 * Fetch a single order by ID, including embedded items
 */
export async function getOrderById(orderId) {
  try {
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    let order = normalizeOrder(orderSnap);
    order = await attachCashier(order);
    order.items = Array.isArray(order.items) ? order.items : [];

    return { data: order, error: null };
  } catch (error) {
    console.error("❌ Error fetching order by ID:", error);
    return { data: null, error };
  }
}

/**
 * Fetch recent orders with pagination support
 * @param {number} limit
 * @param {DocumentSnapshot|null} lastDoc
 */
export async function getRecentOrders(limit = 50, lastDoc = null) {
  try {
    const ordersRef = collection(db, "orders");

    const q = lastDoc
      ? query(
          ordersRef,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limitQuery(limit)
        )
      : query(
          ordersRef,
          orderBy("createdAt", "desc"),
          limitQuery(limit)
        );

    const snapshot = await getDocs(q);

    const orders = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        let order = normalizeOrder(docSnap);
        order = await attachCashier(order);
        return order;
      })
    );

    return {
      data: orders,
      error: null,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === limit,
    };
  } catch (error) {
    console.error("Error fetching order history:", error);
    return {
      data: null,
      error,
      lastDoc: null,
      hasMore: false,
    };
  }
}