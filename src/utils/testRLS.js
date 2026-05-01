/**
 * Firestore Rules Test Utilities
 *
 * This module provides test functions to verify Firestore Security Rules
 * for both Admin and Cashier roles. Tests should be run via browser console.
 *
 * TEMPORARY FILE: Used for migration validation only
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import * as authService from "../services/authService";

// Test credentials
const TEST_USERS = {
  admin: {
    email: "admin@bitesync.test",
    password: "Admin123",
  },
  cashier: {
    email: "cashier@bitesync.test",
    password: "Cashier123",
  },
};

/**
 * Generate unique order number
 */
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${dateStr}-${random}`;
}

function isPermissionDenied(error) {
  return (
    error?.code === "permission-denied" ||
    error?.message?.toLowerCase().includes("permission")
  );
}

async function getCurrentUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function getFirstCategoryOrCreateTemp() {
  const categoriesRef = collection(db, "menu_categories");
  const q = query(categoriesRef, orderBy("name"), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const first = snapshot.docs[0];
    return { id: first.id, ...first.data(), wasCreated: false };
  }

  const created = await addDoc(categoriesRef, {
    name: "TEST Category",
    key: "test_category",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: created.id,
    name: "TEST Category",
    key: "test_category",
    wasCreated: true,
  };
}

/**
 * Test Admin permissions
 * Expected:
 * - Full CRUD on menu_categories/menu_items
 * - Read/write orders if rules allow admin
 */
export async function testAdminPermissions() {
  console.group("🔐 Testing Admin Permissions");

  let testCategoryId = null;
  let testItemId = null;

  try {
    console.log("🔑 Signing in as admin...");
    const { data: signInData, error: signInError } = await authService.signIn(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );

    if (signInError) {
      console.error("❌ Admin sign in failed:", signInError.message);
      console.groupEnd();
      return false;
    }

    const uid = signInData?.user?.uid || signInData?.user?.id;
    const profile = await getCurrentUserProfile(uid);

    if (!profile || profile.role !== "admin") {
      console.error("❌ Signed in user is not admin");
      await authService.signOut();
      console.groupEnd();
      return false;
    }

    console.log("✅ Admin signed in:", signInData.user.email);

    const category = await getFirstCategoryOrCreateTemp();
    testCategoryId = category.id;
    console.log("📦 Using category:", testCategoryId);

    // Test 1: INSERT menu_item
    console.log("\n🧪 Test 1: INSERT menu_item (Admin)");
    const insertedItemRef = await addDoc(collection(db, "menu_items"), {
      name: "TEST Admin Menu Item",
      description: "Test item created by admin",
      price: 9.99,
      costPrice: 4.5,
      categoryId: testCategoryId,
      categoryName: category.name || "TEST Category",
      isAvailable: true,
      ingredients: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    testItemId = insertedItemRef.id;
    console.log("✅ Admin INSERT menu_item PASSED - ID:", testItemId);

    // Test 2: SELECT menu_item
    console.log("\n🧪 Test 2: SELECT menu_item (Admin)");
    const selectedSnap = await getDoc(doc(db, "menu_items", testItemId));
    if (!selectedSnap.exists()) {
      throw new Error("Admin SELECT menu_item failed - item not found");
    }
    console.log("✅ Admin SELECT menu_item PASSED - Name:", selectedSnap.data().name);

    // Test 3: UPDATE menu_item
    console.log("\n🧪 Test 3: UPDATE menu_item (Admin)");
    await updateDoc(doc(db, "menu_items", testItemId), {
      price: 19.99,
      description: "Updated by admin test",
      updatedAt: serverTimestamp(),
    });

    const updatedSnap = await getDoc(doc(db, "menu_items", testItemId));
    console.log("✅ Admin UPDATE menu_item PASSED - New price:", updatedSnap.data().price);

    // Test 4: DELETE menu_item
    console.log("\n🧪 Test 4: DELETE menu_item (Admin)");
    await deleteDoc(doc(db, "menu_items", testItemId));
    testItemId = null;
    console.log("✅ Admin DELETE menu_item PASSED");

    // Test 5: SELECT orders
    console.log("\n🧪 Test 5: SELECT orders (Admin)");
    const ordersSnapshot = await getDocs(
      query(collection(db, "orders"), orderBy("created_at", "desc"), limit(10))
    );
    console.log("✅ Admin SELECT orders PASSED - Count:", ordersSnapshot.size);

    await authService.signOut();
    console.log("\n🔒 Admin signed out");
    console.log("\n✅ Admin Firestore Rules tests: PASS");
    console.groupEnd();
    return true;
  } catch (error) {
    console.error("❌ Unexpected error in admin tests:", error);
    try {
      if (testItemId) await deleteDoc(doc(db, "menu_items", testItemId));
    } catch {}
    await authService.signOut();
    console.groupEnd();
    return false;
  }
}

/**
 * Test Cashier permissions
 * Expected:
 * - READ menu_items
 * - NO create/update/delete menu_items
 * - Create/update/read orders if allowed by rules
 */
export async function testCashierPermissions() {
  console.group("🔐 Testing Cashier Permissions");

  let testOrderId = null;

  try {
    console.log("🔑 Signing in as cashier...");
    const { data: signInData, error: signInError } = await authService.signIn(
      TEST_USERS.cashier.email,
      TEST_USERS.cashier.password
    );

    if (signInError) {
      console.error("❌ Cashier sign in failed:", signInError.message);
      console.groupEnd();
      return false;
    }

    const uid = signInData?.user?.uid || signInData?.user?.id;
    const profile = await getCurrentUserProfile(uid);

    if (!profile || profile.role !== "cashier") {
      console.error("❌ Signed in user is not cashier");
      await authService.signOut();
      console.groupEnd();
      return false;
    }

    console.log("✅ Cashier signed in:", signInData.user.email);

    // Test 1: SELECT menu_items
    console.log("\n🧪 Test 1: SELECT menu_items (Cashier)");
    const menuItemsSnapshot = await getDocs(
      query(collection(db, "menu_items"), orderBy("name"), limit(10))
    );
    console.log("✅ Cashier SELECT menu_items PASSED - Count:", menuItemsSnapshot.size);

    // Get category for blocked create test
    let testCategoryId = null;
    const catSnapshot = await getDocs(
      query(collection(db, "menu_categories"), orderBy("name"), limit(1))
    );
    if (!catSnapshot.empty) {
      testCategoryId = catSnapshot.docs[0].id;
    }

    // Test 2: INSERT menu_item (should fail)
    console.log("\n🧪 Test 2: INSERT menu_item (Cashier - should FAIL)");
    try {
      await addDoc(collection(db, "menu_items"), {
        name: "TEST Cashier Item (should fail)",
        description: "Blocked by rules",
        price: 9.99,
        categoryId: testCategoryId || null,
        isAvailable: true,
        ingredients: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.error("❌ Cashier INSERT menu_item SHOULD HAVE FAILED but succeeded!");
      await authService.signOut();
      console.groupEnd();
      return false;
    } catch (err) {
      if (isPermissionDenied(err)) {
        console.log("✅ Cashier INSERT menu_item correctly BLOCKED:", err.message);
      } else {
        throw err;
      }
    }

    // Test 3: UPDATE menu_item (should fail)
    console.log("\n🧪 Test 3: UPDATE menu_item (Cashier - should FAIL)");
    if (!menuItemsSnapshot.empty) {
      const targetDoc = menuItemsSnapshot.docs[0];
      try {
        await updateDoc(doc(db, "menu_items", targetDoc.id), {
          price: 999.99,
          updatedAt: serverTimestamp(),
        });

        console.error("❌ Cashier UPDATE menu_item SHOULD HAVE FAILED but succeeded!");
        await authService.signOut();
        console.groupEnd();
        return false;
      } catch (err) {
        if (isPermissionDenied(err)) {
          console.log("✅ Cashier UPDATE menu_item correctly BLOCKED:", err.message);
        } else {
          throw err;
        }
      }
    } else {
      console.log("⚠️ Skipping UPDATE test - no menu items exist");
    }

    // Test 4: DELETE menu_item (should fail)
    console.log("\n🧪 Test 4: DELETE menu_item (Cashier - should FAIL)");
    if (!menuItemsSnapshot.empty) {
      const targetDoc = menuItemsSnapshot.docs[0];
      try {
        await deleteDoc(doc(db, "menu_items", targetDoc.id));

        console.error("❌ Cashier DELETE menu_item SHOULD HAVE FAILED but succeeded!");
        await authService.signOut();
        console.groupEnd();
        return false;
      } catch (err) {
        if (isPermissionDenied(err)) {
          console.log("✅ Cashier DELETE menu_item correctly BLOCKED:", err.message);
        } else {
          throw err;
        }
      }
    } else {
      console.log("⚠️ Skipping DELETE test - no menu items exist");
    }

    console.log("\n✅ Cashier menu_items READ-ONLY: PASS");

    // Test 5: INSERT order
    console.log("\n🧪 Test 5: INSERT order (Cashier)");
    const orderNumber = generateOrderNumber();

    const insertedOrderRef = await addDoc(collection(db, "orders"), {
      order_number: orderNumber,
      customer_name: "TEST Customer",
      customer_phone: "",
      subtotal: 100.0,
      service_charge_percent: 10,
      service_charge_amount: 10.0,
      total: 110.0,
      payment_method: "cash",
      status: "pending",
      cashier_id: uid,
      order_type: "take-away",
      table_number: null,
      special_instructions: "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    testOrderId = insertedOrderRef.id;
    console.log("✅ Cashier INSERT order PASSED - Order ID:", testOrderId);

    // Test 6: UPDATE order
    console.log("\n🧪 Test 6: UPDATE order (Cashier)");
    await updateDoc(doc(db, "orders", testOrderId), {
      status: "paid",
      payment_method: "card",
      updated_at: serverTimestamp(),
    });

    const updatedOrderSnap = await getDoc(doc(db, "orders", testOrderId));
    console.log("✅ Cashier UPDATE order PASSED - Status:", updatedOrderSnap.data().status);

    // Test 7: SELECT order
    console.log("\n🧪 Test 7: SELECT order (Cashier)");
    const selectedOrderSnap = await getDoc(doc(db, "orders", testOrderId));
    if (!selectedOrderSnap.exists()) {
      throw new Error("Cashier SELECT order failed");
    }

    console.log("✅ Cashier SELECT order PASSED");
    console.log("\n✅ Cashier orders CRUD: PASS");

    // Cleanup as admin if needed
    console.log("\n🧹 Cleaning up test data...");
    await authService.signOut();

    const { error: adminSignInError } = await authService.signIn(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );

    if (!adminSignInError && testOrderId) {
      try {
        await deleteDoc(doc(db, "orders", testOrderId));
        console.log("✅ Test order cleaned up");
      } catch (cleanupErr) {
        console.warn("⚠️ Failed to cleanup test order:", cleanupErr.message);
      }

      await authService.signOut();
    }

    console.log("\n🔒 Cashier signed out");
    console.groupEnd();
    return true;
  } catch (error) {
    console.error("❌ Unexpected error in cashier tests:", error);
    await authService.signOut();
    console.groupEnd();
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllRLSTests() {
  console.log("🔐 Starting Firestore Rules Tests\n");

  const adminPass = await testAdminPermissions();
  console.log("\n");
  const cashierPass = await testCashierPermissions();

  console.log("\n" + "=".repeat(50));
  if (adminPass && cashierPass) {
    console.log("✅ ALL FIRESTORE RULES TESTS PASSED");
  } else {
    console.log("❌ SOME FIRESTORE RULES TESTS FAILED");
    if (!adminPass) console.log("   - Admin tests failed");
    if (!cashierPass) console.log("   - Cashier tests failed");
  }
  console.log("=".repeat(50));

  return adminPass && cashierPass;
}