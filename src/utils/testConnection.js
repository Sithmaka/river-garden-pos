/**
 * Firebase Connection Test Utility
 *
 * Run this script to verify Firebase Firestore connection is working.
 *
 * Usage:
 * import { testConnection } from "../utils/testConnection"
 * await testConnection()
 */

import { db } from "../services/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

/**
 * Test Firebase connection by querying restaurants collection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testConnection() {
  console.log("🔍 Testing Firebase Firestore connection...\n");

  try {
    // Test 1: Check if Firebase DB initialized
    if (!db) {
      console.error("❌ Firebase DB not initialized");
      console.error("Check firebase.js configuration");
      return false;
    }

    console.log("✅ Firebase client initialized");

    // Test 2: Query restaurants collection
    const q = query(collection(db, "restaurants"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn("⚠️ Query successful but no restaurant found");
      console.warn("Create a document in Firestore:");
      console.warn("Collection: restaurants");
      console.warn("Fields:");
      console.warn('  name: "Demo Restaurant"');
      console.warn("  service_charge_percent: 10");
      console.warn('  currency: "LKR"');
      return false;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    console.log("✅ Database query successful\n");

    console.log("Restaurant Data:");
    console.log("  ID:", doc.id);
    console.log("  Name:", data.name);
    console.log("  Service Charge:", data.service_charge_percent + "%");
    console.log("  Currency:", data.currency);

    if (data.created_at) {
      console.log(
        "  Created:",
        new Date(data.created_at.seconds * 1000).toLocaleString()
      );
    }

    console.log("\n✅ Firebase connection is working correctly");
    console.log("You can now proceed with POS operations.");

    return true;
  } catch (err) {
    console.error("\n❌ Firebase connection test failed:", err.message);
    console.error("\nStack trace:", err.stack);
    return false;
  }
}

// Auto-run message if loaded in browser
if (typeof window !== "undefined" && window.location) {
  console.log("🔍 Firebase connection test utility loaded");
  console.log("💡 Call testConnection() to verify Firebase setup");
}

export default testConnection;