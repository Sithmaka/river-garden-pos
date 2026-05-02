// src/services/offlineQueue.js

const OFFLINE_ORDERS_KEY = "codebell_offline_orders";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

export function getOfflineOrders() {
  const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
  return safeJsonParse(raw, []);
}

export function saveOfflineOrders(orders) {
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders || []));
}

export function createOfflineOrderNumber() {
  const date = new Date();
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");

  const orders = getOfflineOrders();
  const todayOrders = orders.filter((order) =>
    String(order.orderNumber || "").startsWith(`ORD-${ymd}-`)
  );

  const sequence = String(todayOrders.length + 1).padStart(4, "0");

  return `ORD-${ymd}-${sequence}`;
}

export function addOfflineOrder(orderPayload) {
  const orders = getOfflineOrders();

  const offlineOrder = {
    id: `offline_${Date.now()}`,
    offlineId: `offline_${Date.now()}`,
    orderNumber: orderPayload.orderNumber || createOfflineOrderNumber(),
    syncStatus: "pending",
    isOffline: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...orderPayload,
  };

  saveOfflineOrders([offlineOrder, ...orders]);

  return offlineOrder;
}

export function removeOfflineOrder(offlineId) {
  const orders = getOfflineOrders();
  const updated = orders.filter(
    (order) => order.offlineId !== offlineId && order.id !== offlineId
  );

  saveOfflineOrders(updated);
}

export function clearOfflineOrders() {
  localStorage.removeItem(OFFLINE_ORDERS_KEY);
}