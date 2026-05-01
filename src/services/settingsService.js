import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Fetch settings from Firestore
 */
export async function getSettings() {
  try {
    const ref = doc(db, "settings", "restaurant");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return {
        data: {
          service_charge_percentage: 10,
          currency_code: "LKR",
          receipt_header: "",
          receipt_footer: "",
          restaurant_address: "",
          restaurant_phone: "",
          table_count: 10,
        },
        error: null,
      };
    }

    const data = snap.data();

    return {
      data: {
        service_charge_percentage: data.service_charge_percentage ?? 10,
        currency_code: data.currency_code ?? "LKR",
        receipt_header: data.receipt_header ?? "",
        receipt_footer: data.receipt_footer ?? "",
        restaurant_address: data.restaurant_address ?? "",
        restaurant_phone: data.restaurant_phone ?? "",
        table_count: data.table_count ?? 10,
      },
      error: null,
    };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return { data: null, error };
  }
}

/**
 * Update settings in Firestore
 */
export async function updateSettings(
  serviceCharge,
  currencyCode,
  receiptHeader,
  receiptFooter,
  restaurantAddress,
  restaurantPhone,
  tableCount
) {
  try {
    const ref = doc(db, "settings", "restaurant");

    const data = {
      service_charge_percentage: serviceCharge,
      currency_code: currencyCode,
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      restaurant_address: restaurantAddress,
      restaurant_phone: restaurantPhone,
      table_count: tableCount,
      updated_at: new Date().toISOString(),
    };

    await setDoc(ref, data, { merge: true });

    return { data, error: null };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { data: null, error };
  }
}