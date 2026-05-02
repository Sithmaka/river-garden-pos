/**
 * Order Service - Firebase + Offline POS Ready
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const OFFLINE_ORDERS_KEY = "codebell_offline_orders";

/* =========================================================
   BASIC HELPERS
========================================================= */

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function nowIso() {
  return new Date().toISOString();
}

function createOfflineId() {
  return `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createOfflineOrderNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const offlineOrders = getOfflineOrders();
  const todayOrders = offlineOrders.filter((order) =>
    String(order.orderNumber || "").startsWith(`ORD-${dateStr}-`)
  );

  const sequence = String(todayOrders.length + 1).padStart(4, "0");

  return `ORD-${dateStr}-${sequence}`;
}

function normalizeOrderItem(item = {}) {
  const price = Number(item.price ?? item.sellingPrice) || 0;
  const quantity = Number(item.quantity) || 0;

  return {
    id: item.id || "",
    name: item.name || "",
    price,
    quantity,
    line_total: round2(price * quantity),
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
  };
}

function calculateTotals(orderItems = [], serviceChargePercent = 0, orderType = "take-away") {
  const subtotal = round2(
    orderItems.reduce((sum, item) => sum + (Number(item.line_total) || 0), 0)
  );

  const shouldApplyServiceCharge = orderType === "dine-in";

  const service_charge_percent = shouldApplyServiceCharge
    ? Number(serviceChargePercent) || 0
    : 0;

  const service_charge_amount = shouldApplyServiceCharge
    ? round2(subtotal * (service_charge_percent / 100))
    : 0;

  const total = round2(subtotal + service_charge_amount);

  return {
    subtotal,
    service_charge_percent,
    service_charge_amount,
    total,
  };
}

function buildIngredientUsage(orderItems = []) {
  const usageMap = new Map();

  for (const orderItem of orderItems) {
    const qtyOrdered = Number(orderItem.quantity) || 0;
    const ingredients = Array.isArray(orderItem.ingredients)
      ? orderItem.ingredients
      : [];

    for (const ingredient of ingredients) {
      const itemId = ingredient.itemId;
      if (!itemId) continue;

      const perUnitQty = Number(ingredient.qty) || 0;
      const totalRequired = perUnitQty * qtyOrdered;

      if (!usageMap.has(itemId)) {
        usageMap.set(itemId, {
          itemId,
          name: ingredient.name || "",
          sku: ingredient.sku || "",
          unitId: ingredient.unitId || "",
          unitName: ingredient.unitName || "",
          qty: 0,
        });
      }

      usageMap.get(itemId).qty = round2(usageMap.get(itemId).qty + totalRequired);
    }
  }

  return Array.from(usageMap.values());
}

function diffIngredientUsage(oldUsage = [], newUsage = []) {
  const oldMap = new Map(oldUsage.map((u) => [u.itemId, u]));
  const newMap = new Map(newUsage.map((u) => [u.itemId, u]));
  const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);
  const deltas = [];

  for (const itemId of allIds) {
    const oldQty = Number(oldMap.get(itemId)?.qty) || 0;
    const newQty = Number(newMap.get(itemId)?.qty) || 0;
    const delta = round2(newQty - oldQty);

    if (delta !== 0) {
      const base = newMap.get(itemId) || oldMap.get(itemId);

      deltas.push({
        itemId,
        name: base?.name || "",
        sku: base?.sku || "",
        unitId: base?.unitId || "",
        unitName: base?.unitName || "",
        qtyChange: delta,
      });
    }
  }

  return deltas;
}

async function getCurrentUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");
  return user.uid;
}

/* =========================================================
   OFFLINE STORAGE HELPERS
========================================================= */

export function getOfflineOrders() {
  try {
    const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineOrders(orders = []) {
  localStorage.setItem(OFFLINE_ORDERS_KEY, JSON.stringify(orders));
}

function addOfflineOrder(order) {
  const existing = getOfflineOrders();
  saveOfflineOrders([order, ...existing]);
}

function removeOfflineOrder(localId) {
  const existing = getOfflineOrders();
  saveOfflineOrders(existing.filter((order) => order.localId !== localId));
}

function updateOfflineOrder(localId, patch = {}) {
  const existing = getOfflineOrders();
  saveOfflineOrders(
    existing.map((order) =>
      order.localId === localId ? { ...order, ...patch } : order
    )
  );
}

export function getPendingOfflineOrderCount() {
  return getOfflineOrders().filter((o) => o.syncStatus !== "synced").length;
}

/* =========================================================
   FIRESTORE HELPERS
========================================================= */

async function getSettingsDoc() {
  const snap = await getDoc(doc(db, "settings", "global"));
  return snap.exists() ? snap.data() : {};
}

async function getTableCount() {
  const settings = await getSettingsDoc();
  return Number(settings.table_count) || Number(settings.tableCount) || 0;
}

async function generateOrderNumberTx(transaction) {
  const counterRef = doc(db, "counters", "orders");
  const counterSnap = await transaction.get(counterRef);

  let nextValue = 1;

  if (counterSnap.exists()) {
    const data = counterSnap.data();
    nextValue = (Number(data.value) || 0) + 1;
  }

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const sequence = String(nextValue).padStart(4, "0");

  return {
    counterRef,
    nextValue,
    orderNumber: `ORD-${dateStr}-${sequence}`,
  };
}

async function getMenuItemWithIngredients(menuItemId) {
  const snap = await getDoc(doc(db, "menu_items", menuItemId));

  if (!snap.exists()) {
    throw new Error(`Menu item not found: ${menuItemId}`);
  }

  const data = snap.data();

  return {
    id: snap.id,
    name: data.name || "",
    price: Number(data.price ?? data.sellingPrice) || 0,
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    isAvailable: data.isAvailable ?? data.is_available ?? true,
  };
}

async function enrichOrderItems(orderItems = []) {
  const enriched = [];

  for (const item of orderItems) {
    try {
      const menuItem = await getMenuItemWithIngredients(item.id);

      enriched.push(
        normalizeOrderItem({
          id: menuItem.id,
          name: item.name || menuItem.name,
          price:
            item.price !== undefined
              ? Number(item.price)
              : Number(menuItem.price),
          quantity: Number(item.quantity) || 0,
          ingredients: menuItem.ingredients,
        })
      );
    } catch {
      enriched.push(normalizeOrderItem(item));
    }
  }

  return enriched;
}

async function applyInventoryDeltaTx(transaction, deltas = [], meta = {}) {
  const validDeltas = deltas.filter((d) => d.itemId && Number(d.qtyChange) !== 0);
  const inventorySnaps = new Map();

  for (const delta of validDeltas) {
    const inventoryRef = doc(db, "items", delta.itemId);
    const inventorySnap = await transaction.get(inventoryRef);

    if (!inventorySnap.exists()) {
      throw new Error(`Inventory item not found: ${delta.itemId}`);
    }

    inventorySnaps.set(delta.itemId, {
      ref: inventoryRef,
      snap: inventorySnap,
    });
  }

  const movementWrites = [];

  for (const delta of validDeltas) {
    const entry = inventorySnaps.get(delta.itemId);
    const inventoryData = entry.snap.data() || {};
    const currentStock = Number(inventoryData.currentStock) || 0;

    let nextStock = currentStock;

    if (delta.qtyChange > 0) {
      if (currentStock < delta.qtyChange) {
        throw new Error(
          `Insufficient stock for ${
            delta.name || inventoryData.name || delta.itemId
          }. Required ${delta.qtyChange}, available ${currentStock}.`
        );
      }

      nextStock = round2(currentStock - delta.qtyChange);
    } else if (delta.qtyChange < 0) {
      nextStock = round2(currentStock + Math.abs(delta.qtyChange));
    }

    transaction.update(entry.ref, {
      currentStock: nextStock,
      updatedAt: serverTimestamp(),
      lastSoldAt:
        delta.qtyChange > 0
          ? serverTimestamp()
          : inventoryData.lastSoldAt || null,
    });

    movementWrites.push({
      inventoryItemId: delta.itemId,
      itemId: delta.itemId,
      itemName: delta.name || inventoryData.name || "",
      sku: delta.sku || inventoryData.sku || "",
      unitId: delta.unitId || inventoryData.unitId || "",
      unitName: delta.unitName || inventoryData.unitName || "",
      changeType: delta.qtyChange > 0 ? "deduct" : "restore",
      quantity: round2(Math.abs(delta.qtyChange)),
      previousStock: currentStock,
      newStock: nextStock,
      orderId: meta.orderId || null,
      orderNumber: meta.orderNumber || null,
      reason: meta.reason || "order_update",
      cashierId: meta.cashierId || null,
      createdAt: new Date(),
    });
  }

  return movementWrites;
}

/* =========================================================
   OFFLINE ORDER CREATE
========================================================= */

async function createOfflineOrder(orderData, orderItems, serviceChargePercent) {
  const cashierId = auth.currentUser?.uid || "offline-user";
  const orderType = orderData.order_type || "take-away";

  const allowedOrderTypes = ["dine-in", "take-away", "delivery"];

  if (!allowedOrderTypes.includes(orderType)) {
    throw new Error("Invalid order type");
  }

  if (orderType === "dine-in" && !Number(orderData.table_number)) {
    throw new Error("Table number is required for dine-in orders");
  }

  const localId = createOfflineId();
  const orderNumber = createOfflineOrderNumber();

  const enrichedItems = orderItems.map(normalizeOrderItem);
  const totals = calculateTotals(enrichedItems, serviceChargePercent, orderType);
  const ingredientUsage = buildIngredientUsage(enrichedItems);

  const isDineInDeferred =
    orderType === "dine-in" &&
    (!orderData.payment_method || orderData.payment_method === "pending");

  const offlineOrder = {
    id: localId,
    localId,
    isOffline: true,
    syncStatus: "pending",

    orderNumber,
    offlineOrderNumber: orderNumber,
    firebaseOrderId: null,

    cashierId,

    customer_name: orderData.customer_name || null,
    customer_phone: orderData.customer_phone || null,
    special_instructions: orderData.special_instructions || null,

    order_type: orderType,
    table_number:
      orderType === "dine-in" ? Number(orderData.table_number) : null,

    payment_method: isDineInDeferred
      ? "pending"
      : orderData.payment_method || "cash",

    status: isDineInDeferred ? "pending" : "paid",
    paid_at: isDineInDeferred ? null : new Date(),

    ...totals,

    items: enrichedItems,
    ingredientUsage,

    createdAt: new Date(),
    updatedAt: new Date(),

    offlineCreatedAt: nowIso(),
    syncedAt: null,
    syncError: null,
  };

  addOfflineOrder(offlineOrder);

  return {
    data: offlineOrder,
    error: null,
    offline: true,
  };
}

/* =========================================================
   ONLINE ORDER SUBMIT
========================================================= */

async function submitOrderOnline(orderData, orderItems, serviceChargePercent) {
  const cashierId = await getCurrentUserId();

  const allowedOrderTypes = ["dine-in", "take-away", "delivery"];
  const orderType = orderData.order_type || "take-away";

  if (!allowedOrderTypes.includes(orderType)) {
    throw new Error("Invalid order type");
  }

  let tableNumber = null;

  if (orderType === "dine-in") {
    tableNumber = Number(orderData.table_number);

    if (!tableNumber) {
      throw new Error("Table number is required for dine-in orders");
    }

    const tableCount = await getTableCount();

    if (tableCount > 0 && (tableNumber < 1 || tableNumber > tableCount)) {
      throw new Error(`Table number must be between 1 and ${tableCount}`);
    }
  }

  const enrichedItems = await enrichOrderItems(orderItems);
  const totals = calculateTotals(enrichedItems, serviceChargePercent, orderType);
  const ingredientUsage = buildIngredientUsage(enrichedItems);

  const result = await runTransaction(db, async (transaction) => {
    const { counterRef, nextValue, orderNumber } =
      await generateOrderNumberTx(transaction);

    const orderRef = doc(collection(db, "orders"));

    const movementWrites = await applyInventoryDeltaTx(
      transaction,
      ingredientUsage.map((u) => ({ ...u, qtyChange: u.qty })),
      {
        orderId: orderRef.id,
        orderNumber,
        cashierId,
        reason: "order_submit",
      }
    );

    const isDineInDeferred =
      orderType === "dine-in" &&
      (!orderData.payment_method || orderData.payment_method === "pending");

    transaction.set(
      counterRef,
      {
        value: nextValue,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(orderRef, {
      orderNumber,
      cashierId,

      customer_name: orderData.customer_name || null,
      customer_phone: orderData.customer_phone || null,
      special_instructions: orderData.special_instructions || null,

      order_type: orderType,
      table_number: tableNumber,

      payment_method: isDineInDeferred
        ? "pending"
        : orderData.payment_method || "cash",

      status: isDineInDeferred ? "pending" : "paid",
      paid_at: isDineInDeferred ? null : new Date(),

      ...totals,

      items: enrichedItems,
      ingredientUsage,

      isOffline: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: orderRef.id,
      orderNumber,
      movementWrites,
    };
  });

  if (result.movementWrites?.length) {
    await Promise.all(
      result.movementWrites.map((movement) =>
        addDoc(collection(db, "stock_movements"), movement)
      )
    );
  }

  const savedOrderSnap = await getDoc(doc(db, "orders", result.id));

  return {
    data: savedOrderSnap.exists()
      ? { id: savedOrderSnap.id, ...savedOrderSnap.data() }
      : { id: result.id, orderNumber: result.orderNumber },
    error: null,
    offline: false,
  };
}

/* =========================================================
   PUBLIC: SUBMIT ORDER
========================================================= */

export async function submitOrder(orderData, orderItems, serviceChargePercent) {
  try {
    if (!isOnline()) {
      return await createOfflineOrder(orderData, orderItems, serviceChargePercent);
    }

    return await submitOrderOnline(orderData, orderItems, serviceChargePercent);
  } catch (error) {
    console.error("Order submission error:", error);

    const message = String(error?.message || "").toLowerCase();

    const shouldFallbackOffline =
      !isOnline() ||
      message.includes("offline") ||
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("unavailable");

    if (shouldFallbackOffline) {
      try {
        return await createOfflineOrder(orderData, orderItems, serviceChargePercent);
      } catch (offlineError) {
        return { data: null, error: offlineError };
      }
    }

    return { data: null, error };
  }
}

/* =========================================================
   SYNC OFFLINE ORDERS
========================================================= */

export async function syncOfflineOrders() {
  if (!isOnline()) {
    return {
      synced: 0,
      failed: 0,
      pending: getPendingOfflineOrderCount(),
      error: new Error("Device is offline"),
    };
  }

  const offlineOrders = getOfflineOrders().filter(
    (order) => order.syncStatus !== "synced"
  );

  let synced = 0;
  let failed = 0;

  for (const offlineOrder of offlineOrders) {
    try {
      updateOfflineOrder(offlineOrder.localId, {
        syncStatus: "syncing",
        syncError: null,
      });

      const orderData = {
        customer_name: offlineOrder.customer_name,
        customer_phone: offlineOrder.customer_phone,
        special_instructions: offlineOrder.special_instructions,
        payment_method: offlineOrder.payment_method,
        order_type: offlineOrder.order_type,
        table_number: offlineOrder.table_number,
      };

      const result = await submitOrderOnline(
        orderData,
        offlineOrder.items,
        offlineOrder.service_charge_percent || 0
      );

      if (result.error) throw result.error;

      removeOfflineOrder(offlineOrder.localId);
      synced += 1;
    } catch (error) {
      failed += 1;

      updateOfflineOrder(offlineOrder.localId, {
        syncStatus: "failed",
        syncError: error?.message || "Sync failed",
      });

      console.error("Offline order sync failed:", error);
    }
  }

  return {
    synced,
    failed,
    pending: getPendingOfflineOrderCount(),
    error: null,
  };
}

/* =========================================================
   ORDER UPDATE ACTIONS
========================================================= */

export async function addItemsToOrder(orderId, newItems, serviceChargePercent) {
  try {
    if (String(orderId).startsWith("offline_")) {
      throw new Error("Offline order editing is not supported before sync.");
    }

    const cashierId = await getCurrentUserId();
    const orderRef = doc(db, "orders", orderId);
    const preparedItems = await enrichOrderItems(newItems);

    const result = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) throw new Error("Order not found");

      const order = orderSnap.data();
      const existingItems = Array.isArray(order.items) ? [...order.items] : [];

      for (const newItem of preparedItems) {
        const existingIndex = existingItems.findIndex(
          (item) => item.id === newItem.id
        );

        if (existingIndex >= 0) {
          const mergedQty =
            (Number(existingItems[existingIndex].quantity) || 0) +
            (Number(newItem.quantity) || 0);

          existingItems[existingIndex] = normalizeOrderItem({
            ...existingItems[existingIndex],
            price: newItem.price,
            quantity: mergedQty,
            ingredients: newItem.ingredients,
          });
        } else {
          existingItems.push(newItem);
        }
      }

      const oldUsage = Array.isArray(order.ingredientUsage)
        ? order.ingredientUsage
        : buildIngredientUsage(Array.isArray(order.items) ? order.items : []);

      const newUsage = buildIngredientUsage(existingItems);
      const deltas = diffIngredientUsage(oldUsage, newUsage);

      const totals = calculateTotals(
        existingItems,
        serviceChargePercent,
        order.order_type || "take-away"
      );

      const movementWrites = await applyInventoryDeltaTx(transaction, deltas, {
        orderId,
        orderNumber: order.orderNumber || null,
        cashierId,
        reason: "order_add_items",
      });

      transaction.update(orderRef, {
        items: existingItems,
        ingredientUsage: newUsage,
        ...totals,
        updatedAt: serverTimestamp(),
      });

      return { movementWrites };
    });

    if (result.movementWrites?.length) {
      await Promise.all(
        result.movementWrites.map((movement) =>
          addDoc(collection(db, "stock_movements"), movement)
        )
      );
    }

    const updatedOrderSnap = await getDoc(orderRef);

    return {
      data: updatedOrderSnap.exists()
        ? { id: updatedOrderSnap.id, ...updatedOrderSnap.data() }
        : null,
      error: null,
    };
  } catch (error) {
    console.error("Add items to order error:", error);
    return { data: null, error };
  }
}

export async function removeItemFromOrder(orderId, menuItemId, serviceChargePercent) {
  try {
    const cashierId = await getCurrentUserId();
    const orderRef = doc(db, "orders", orderId);

    const result = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) throw new Error("Order not found");

      const order = orderSnap.data();
      const currentItems = Array.isArray(order.items) ? order.items : [];
      const updatedItems = currentItems.filter((item) => item.id !== menuItemId);

      if (updatedItems.length === currentItems.length) {
        throw new Error("Item not found");
      }

      const oldUsage = Array.isArray(order.ingredientUsage)
        ? order.ingredientUsage
        : buildIngredientUsage(currentItems);

      const newUsage = buildIngredientUsage(updatedItems);
      const deltas = diffIngredientUsage(oldUsage, newUsage);

      const totals = calculateTotals(
        updatedItems,
        serviceChargePercent,
        order.order_type || "take-away"
      );

      const movementWrites = await applyInventoryDeltaTx(transaction, deltas, {
        orderId,
        orderNumber: order.orderNumber || null,
        cashierId,
        reason: "order_remove_item",
      });

      transaction.update(orderRef, {
        items: updatedItems,
        ingredientUsage: newUsage,
        ...totals,
        updatedAt: serverTimestamp(),
      });

      return { movementWrites };
    });

    if (result.movementWrites?.length) {
      await Promise.all(
        result.movementWrites.map((movement) =>
          addDoc(collection(db, "stock_movements"), movement)
        )
      );
    }

    const updatedOrderSnap = await getDoc(orderRef);

    return {
      data: updatedOrderSnap.exists()
        ? { id: updatedOrderSnap.id, ...updatedOrderSnap.data() }
        : null,
      error: null,
    };
  } catch (error) {
    console.error("Remove item from order error:", error);
    return { data: null, error };
  }
}

export async function updateItemQuantityInOrder(
  orderId,
  menuItemId,
  newQuantity,
  serviceChargePercent
) {
  try {
    const cashierId = await getCurrentUserId();
    const orderRef = doc(db, "orders", orderId);
    const safeQty = Number(newQuantity) || 0;

    const result = await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) throw new Error("Order not found");

      const order = orderSnap.data();
      const currentItems = Array.isArray(order.items) ? [...order.items] : [];

      const itemIndex = currentItems.findIndex((item) => item.id === menuItemId);
      if (itemIndex < 0) throw new Error("Item not found");

      if (safeQty <= 0) {
        currentItems.splice(itemIndex, 1);
      } else {
        currentItems[itemIndex] = normalizeOrderItem({
          ...currentItems[itemIndex],
          quantity: safeQty,
        });
      }

      const oldUsage = Array.isArray(order.ingredientUsage)
        ? order.ingredientUsage
        : buildIngredientUsage(Array.isArray(order.items) ? order.items : []);

      const newUsage = buildIngredientUsage(currentItems);
      const deltas = diffIngredientUsage(oldUsage, newUsage);

      const totals = calculateTotals(
        currentItems,
        serviceChargePercent,
        order.order_type || "take-away"
      );

      const movementWrites = await applyInventoryDeltaTx(transaction, deltas, {
        orderId,
        orderNumber: order.orderNumber || null,
        cashierId,
        reason: "order_update_quantity",
      });

      transaction.update(orderRef, {
        items: currentItems,
        ingredientUsage: newUsage,
        ...totals,
        updatedAt: serverTimestamp(),
      });

      return { movementWrites };
    });

    if (result.movementWrites?.length) {
      await Promise.all(
        result.movementWrites.map((movement) =>
          addDoc(collection(db, "stock_movements"), movement)
        )
      );
    }

    const updatedOrderSnap = await getDoc(orderRef);

    return {
      data: updatedOrderSnap.exists()
        ? { id: updatedOrderSnap.id, ...updatedOrderSnap.data() }
        : null,
      error: null,
    };
  } catch (error) {
    console.error("Update item quantity error:", error);
    return { data: null, error };
  }
}

export async function closeOrderAsPaid(orderId, paymentMethod) {
  try {
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
      status: "paid",
      payment_method: paymentMethod,
      paid_at: new Date(),
      updatedAt: serverTimestamp(),
    });

    const updatedOrderSnap = await getDoc(orderRef);

    return {
      data: updatedOrderSnap.exists()
        ? { id: updatedOrderSnap.id, ...updatedOrderSnap.data() }
        : null,
      error: null,
    };
  } catch (error) {
    console.error("Error closing order:", error);
    return { data: null, error };
  }
}

export async function deleteOrderItem(orderId, orderItemId, serviceChargePercent) {
  return removeItemFromOrder(orderId, orderItemId, serviceChargePercent);
}

export async function deleteOrder(orderId) {
  try {
    const cashierId = await getCurrentUserId();
    const orderRef = doc(db, "orders", orderId);

    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) throw new Error("Order not found");

    const order = orderSnap.data();

    if (order.status === "open") {
      throw new Error("Cannot delete open orders. Please mark as paid first.");
    }

    const oldUsage = Array.isArray(order.ingredientUsage)
      ? order.ingredientUsage
      : buildIngredientUsage(Array.isArray(order.items) ? order.items : []);

    const result = await runTransaction(db, async (transaction) => {
      const movementWrites = await applyInventoryDeltaTx(
        transaction,
        oldUsage.map((u) => ({
          ...u,
          qtyChange: -u.qty,
        })),
        {
          orderId,
          orderNumber: order.orderNumber || null,
          cashierId,
          reason: "order_delete_restore_stock",
        }
      );

      transaction.delete(orderRef);

      return { movementWrites };
    });

    if (result.movementWrites?.length) {
      await Promise.all(
        result.movementWrites.map((movement) =>
          addDoc(collection(db, "stock_movements"), movement)
        )
      );
    }

    return {
      data: { id: orderId, deleted: true },
      error: null,
    };
  } catch (error) {
    console.error("Delete order error:", error);
    return { data: null, error };
  }
}

/* =========================================================
   READ HELPERS
========================================================= */

export async function getOrderById(orderId) {
  try {
    if (String(orderId).startsWith("offline_")) {
      const offlineOrder = getOfflineOrders().find((o) => o.localId === orderId);

      if (!offlineOrder) {
        return { data: null, error: new Error("Offline order not found") };
      }

      return { data: offlineOrder, error: null };
    }

    const snap = await getDoc(doc(db, "orders", orderId));

    if (!snap.exists()) {
      return { data: null, error: new Error("Order not found") };
    }

    return {
      data: { id: snap.id, ...snap.data() },
      error: null,
    };
  } catch (error) {
    console.error("Get order by ID error:", error);
    return { data: null, error };
  }
}

export async function getRecentOrders(limitCount = 20) {
  try {
    const offlineOrders = getOfflineOrders();

    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snap = await getDocs(q);

    const onlineOrders = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return {
      data: [...offlineOrders, ...onlineOrders],
      error: null,
    };
  } catch (error) {
    console.error("Get recent orders error:", error);

    return {
      data: getOfflineOrders(),
      error: null,
    };
  }
}