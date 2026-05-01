import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "./firebase";

function startOfDay(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  return date;
}

function endOfDay(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T23:59:59`);
  return date;
}

export async function getPaidOrdersForAnalysis(fromDate = "", toDate = "") {
  try {
    const constraints = [];

    constraints.push(where("status", "==", "paid"));

    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);

    if (from) constraints.push(where("paid_at", ">=", from));
    if (to) constraints.push(where("paid_at", "<=", to));

    constraints.push(orderBy("paid_at", "desc"));

    const q = query(collection(db, "orders"), ...constraints);
    const snap = await getDocs(q);

    return {
      data: snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      error: null,
    };
  } catch (error) {
    console.error("Order analysis load error:", error);
    return { data: [], error };
  }
}