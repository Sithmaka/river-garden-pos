import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Get printer configuration
 */
export async function getPrinterConfiguration() {
  try {
    const ref = doc(db, "printer_config", "config");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("📋 No printer config found, using defaults");

      return {
        customerReceiptPrinter: null,
        kitchenOrderPrinter: null,
        isQzTray: true
      };
    }

    const data = snap.data();

    return {
      customerReceiptPrinter: data.customerReceiptPrinter || null,
      kitchenOrderPrinter: data.kitchenOrderPrinter || null,
      isQzTray: data.isQzTray !== false
    };

  } catch (error) {
    console.error("Failed to get printer configuration:", error);
    throw error;
  }
}

/**
 * Save printer configuration
 */
export async function savePrinterConfiguration(
  customerReceiptPrinter,
  kitchenOrderPrinter,
  isQzTray = true
) {
  try {
    const ref = doc(db, "printer_config", "config");

    const payload = {
      customerReceiptPrinter,
      kitchenOrderPrinter,
      isQzTray,
      updatedAt: serverTimestamp()
    };

    await setDoc(ref, payload, { merge: true });

    console.log("✅ Printer configuration saved");

    return { success: true, error: null };

  } catch (error) {
    console.error("❌ Failed to save printer configuration:", error);
    return { success: false, error };
  }
}

/**
 * Clear printer configuration
 */
export async function clearPrinterConfiguration() {
  try {
    const ref = doc(db, "printer_config", "config");

    await updateDoc(ref, {
      customerReceiptPrinter: null,
      kitchenOrderPrinter: null,
      updatedAt: serverTimestamp()
    });

    console.log("🗑 Printer configuration cleared");

    return { success: true, error: null };

  } catch (error) {
    console.error("❌ Failed to clear printer configuration:", error);
    return { success: false, error };
  }
}

/**
 * Subscribe to realtime printer configuration updates
 */
export async function subscribeToPrinterConfiguration(callback) {
  try {
    const ref = doc(db, "printer_config", "config");

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      console.log("🔄 Printer configuration updated");

      callback({
        customerReceiptPrinter: data.customerReceiptPrinter || null,
        kitchenOrderPrinter: data.kitchenOrderPrinter || null,
        isQzTray: data.isQzTray !== false
      });
    });

    return unsubscribe;

  } catch (error) {
    console.error("Failed to subscribe to printer configuration:", error);
    throw error;
  }
}

export default {
  getPrinterConfiguration,
  savePrinterConfiguration,
  clearPrinterConfiguration,
  subscribeToPrinterConfiguration
};