// src/services/syncService.js
import { submitOrder } from "./orderService";
import { getOfflineOrders, removeOfflineOrder } from "./offlineQueue";

const OFFLINE_SYNC_MAP_KEY = "offline_order_sync_map";

function getSyncMap() {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_SYNC_MAP_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSyncMap(map) {
  localStorage.setItem(OFFLINE_SYNC_MAP_KEY, JSON.stringify(map));
}

export async function syncOfflineOrders() {
  const offlineOrders = getOfflineOrders();

  if (!navigator.onLine || offlineOrders.length === 0) {
    return {
      synced: 0,
      failed: 0,
      remaining: offlineOrders.length,
    };
  }

  let synced = 0;
  let failed = 0;

  for (const offlineOrder of offlineOrders) {
    try {
      const orderData = {
        customer_name: offlineOrder.customer_name || null,
        customer_phone: offlineOrder.customer_phone || null,
        special_instructions: offlineOrder.special_instructions || null,
        payment_method: offlineOrder.payment_method || "cash",
        order_type: offlineOrder.order_type || "take-away",
        table_number: offlineOrder.table_number || null,
      };

      const orderItems = Array.isArray(offlineOrder.items)
        ? offlineOrder.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 0,
            ingredients: Array.isArray(item.ingredients)
              ? item.ingredients
              : [],
          }))
        : [];

      const serviceChargePercent =
        Number(offlineOrder.service_charge_percent) || 0;

      const { data, error } = await submitOrder(
        orderData,
        orderItems,
        serviceChargePercent
      );

      if (error) throw error;

      const offlineId = offlineOrder.offlineId || offlineOrder.id;

      if (offlineId && data?.id) {
        const syncMap = getSyncMap();
        syncMap[offlineId] = data.id;
        saveSyncMap(syncMap);
      }

      removeOfflineOrder(offlineId);
      synced += 1;
    } catch (error) {
      console.error("Offline order sync failed:", error);
      failed += 1;
    }
  }

  return {
    synced,
    failed,
    remaining: getOfflineOrders().length,
  };
}

export function startOfflineSyncWatcher({ onSynced } = {}) {
  const runSync = async () => {
    if (!navigator.onLine) return;

    const result = await syncOfflineOrders();

    if (result.synced > 0 && typeof onSynced === "function") {
      onSynced(result);
    }
  };

  window.addEventListener("online", runSync);
  runSync();

  return () => {
    window.removeEventListener("online", runSync);
  };
}