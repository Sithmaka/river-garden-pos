/**
 * Menu Service (Firebase Version)
 *
 * Handles menu categories and menu items using Firestore.
 * Supports ingredients mapping so stock can be deducted during order placement.
 */

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================================================
   HELPERS
========================================================= */

function normalizeCategory(docSnap) {
  const data = docSnap.data();

  return {
    id: docSnap.id,
    key: data.key || "",
    name: data.name || "",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

function normalizeIngredient(ingredient = {}) {
  return {
    itemId: ingredient.itemId || "",
    name: ingredient.name || "",
    qty: Number(ingredient.qty) || 0,
    sku: ingredient.sku || "",
    unitId: ingredient.unitId || "",
    unitName: ingredient.unitName || "",
  };
}

function normalizeMenuItem(docSnap, categoryMap = {}) {
  const data = docSnap.data();

  const category =
    data.categoryId && categoryMap[data.categoryId]
      ? categoryMap[data.categoryId]
      : null;

  const sellingPrice =
    data.sellingPrice !== undefined
      ? Number(data.sellingPrice)
      : data.price !== undefined
      ? Number(data.price)
      : 0;

  const costPrice =
    data.costPrice !== undefined
      ? Number(data.costPrice)
      : data.cost_price !== undefined
      ? Number(data.cost_price)
      : 0;

  return {
    id: docSnap.id,
    name: data.name || "",
    price: sellingPrice,
    sellingPrice,
    costPrice,
    is_available: data.is_available ?? data.isAvailable ?? data.isActive ?? true,
    isAvailable: data.isAvailable ?? data.is_available ?? data.isActive ?? true,
    isActive: data.isActive ?? data.isAvailable ?? data.is_available ?? true,
    category_id: data.categoryId || null,
    categoryId: data.categoryId || null,
    categoryName: data.categoryName || category?.name || "",
    description: data.description || "",
    itemNumber: data.itemNumber || "",
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.map(normalizeIngredient)
      : [],
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    category,
  };
}

/* =========================================================
   CATEGORIES
========================================================= */

export async function getCategories() {
  try {
    const categoriesRef = collection(db, "menu_categories");
    const q = query(categoriesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    const data = snapshot.docs.map(normalizeCategory);

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return { data: null, error };
  }
}

export async function createCategory(categoryData) {
  try {
    const name = categoryData.name?.trim() || "";
    const key =
      categoryData.key?.trim() ||
      name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w-]/g, "");

    const payload = {
      name,
      key,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "menu_categories"), payload);
    const createdSnap = await getDoc(doc(db, "menu_categories", docRef.id));

    return {
      data: {
        id: createdSnap.id,
        ...createdSnap.data(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error creating menu category:", error);
    return { data: null, error };
  }
}

export async function deleteCategory(categoryId, deleteItems = false) {
  try {
    const itemsRef = collection(db, "menu_items");
    const q = query(itemsRef, where("categoryId", "==", categoryId));
    const itemsSnapshot = await getDocs(q);

    if (!deleteItems && !itemsSnapshot.empty) {
      throw new Error(
        "Cannot delete category with existing menu items. Please delete the items first or use force delete."
      );
    }

    if (deleteItems && !itemsSnapshot.empty) {
      const deletePromises = itemsSnapshot.docs.map((itemDoc) =>
        deleteDoc(doc(db, "menu_items", itemDoc.id))
      );
      await Promise.all(deletePromises);
    }

    await deleteDoc(doc(db, "menu_categories", categoryId));

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting menu category:", error);
    return { success: false, error };
  }
}

/* =========================================================
   MENU ITEMS
========================================================= */

export async function getAllMenuItems() {
  try {
    const [itemsSnapshot, categoriesResult] = await Promise.all([
      getDocs(query(collection(db, "menu_items"), orderBy("name", "asc"))),
      getCategories(),
    ]);

    if (categoriesResult.error) {
      return { data: null, error: categoriesResult.error };
    }

    const categoryMap = {};
    (categoriesResult.data || []).forEach((category) => {
      categoryMap[category.id] = category;
    });

    const data = itemsSnapshot.docs.map((docSnap) =>
      normalizeMenuItem(docSnap, categoryMap)
    );

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error fetching menu items:", error);
    return { data: null, error };
  }
}

export async function getMenuItemsByCategory(categoryId) {
  try {
    const itemsRef = collection(db, "menu_items");
    const q = query(
      itemsRef,
      where("categoryId", "==", categoryId),
      orderBy("name", "asc")
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((docSnap) => normalizeMenuItem(docSnap));

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching menu items by category:", error);
    return { data: null, error };
  }
}

export async function getMenuItemById(itemId) {
  try {
    const snap = await getDoc(doc(db, "menu_items", itemId));

    if (!snap.exists()) {
      return {
        data: null,
        error: new Error("Menu item not found"),
      };
    }

    return {
      data: normalizeMenuItem(snap),
      error: null,
    };
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return { data: null, error };
  }
}

export async function createMenuItem(itemData) {
  try {
    let categoryName = itemData.categoryName || "";

    const selectedCategoryId =
      itemData.categoryId || itemData.category_id || null;

    if (selectedCategoryId && !categoryName) {
      const categorySnap = await getDoc(
        doc(db, "menu_categories", selectedCategoryId)
      );

      if (categorySnap.exists()) {
        categoryName = categorySnap.data().name || "";
      }
    }

    const sellingPrice =
      itemData.sellingPrice !== undefined
        ? Number(itemData.sellingPrice)
        : Number(itemData.price) || 0;

    const payload = {
      name: itemData.name?.trim() || "",
      description: itemData.description?.trim() || "",
      sellingPrice,
      price: sellingPrice,
      costPrice: Number(itemData.costPrice) || 0,
      categoryId: selectedCategoryId,
      categoryName,
      isAvailable:
        itemData.isAvailable ?? itemData.is_available ?? itemData.isActive ?? true,
      isActive:
        itemData.isActive ?? itemData.isAvailable ?? itemData.is_available ?? true,
      itemNumber: itemData.itemNumber || "",
      ingredients: Array.isArray(itemData.ingredients)
        ? itemData.ingredients.map(normalizeIngredient)
        : [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "menu_items"), payload);
    const createdSnap = await getDoc(doc(db, "menu_items", docRef.id));

    return {
      data: normalizeMenuItem(createdSnap),
      error: null,
    };
  } catch (error) {
    console.error("Error creating menu item:", error);
    return { data: null, error };
  }
}

export async function updateMenuItem(itemId, updates) {
  try {
    const itemRef = doc(db, "menu_items", itemId);

    const payload = {
      updatedAt: serverTimestamp(),
    };

    if (updates.name !== undefined) {
      payload.name = updates.name?.trim() || "";
    }

    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || "";
    }

    if (updates.price !== undefined || updates.sellingPrice !== undefined) {
      const sellingPrice =
        updates.sellingPrice !== undefined
          ? Number(updates.sellingPrice)
          : Number(updates.price) || 0;

      payload.sellingPrice = sellingPrice;
      payload.price = sellingPrice;
    }

    if (updates.costPrice !== undefined) {
      payload.costPrice = Number(updates.costPrice) || 0;
    }

    const selectedCategoryId =
      updates.categoryId !== undefined
        ? updates.categoryId
        : updates.category_id !== undefined
        ? updates.category_id
        : undefined;

    if (selectedCategoryId !== undefined) {
      payload.categoryId = selectedCategoryId || null;

      if (selectedCategoryId) {
        const categorySnap = await getDoc(
          doc(db, "menu_categories", selectedCategoryId)
        );
        payload.categoryName = categorySnap.exists()
          ? categorySnap.data().name || ""
          : "";
      } else {
        payload.categoryName = "";
      }
    }

    if (updates.isAvailable !== undefined) {
      payload.isAvailable = updates.isAvailable;
      payload.isActive = updates.isAvailable;
    }

    if (updates.is_available !== undefined) {
      payload.isAvailable = updates.is_available;
      payload.isActive = updates.is_available;
    }

    if (updates.isActive !== undefined) {
      payload.isAvailable = updates.isActive;
      payload.isActive = updates.isActive;
    }

    if (updates.itemNumber !== undefined) {
      payload.itemNumber = updates.itemNumber || "";
    }

    if (updates.ingredients !== undefined) {
      payload.ingredients = Array.isArray(updates.ingredients)
        ? updates.ingredients.map(normalizeIngredient)
        : [];
    }

    await updateDoc(itemRef, payload);

    const updatedSnap = await getDoc(itemRef);

    if (!updatedSnap.exists()) {
      return {
        data: null,
        error: new Error("Menu item not found after update"),
      };
    }

    const data = normalizeMenuItem(updatedSnap);

    console.log("✅ Menu item updated successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Unexpected error updating menu item:", error);
    return { data: null, error };
  }
}

export async function deleteMenuItem(itemId) {
  try {
    await deleteDoc(doc(db, "menu_items", itemId));

    console.log("✅ Menu item deleted:", itemId);
    return { data: { id: itemId }, error: null };
  } catch (error) {
    console.error("❌ Unexpected error deleting menu item:", error);
    return { data: null, error };
  }
}

export async function toggleItemAvailability(itemId, currentStatus) {
  try {
    const itemRef = doc(db, "menu_items", itemId);
    const newStatus = !currentStatus;

    await updateDoc(itemRef, {
      isAvailable: newStatus,
      isActive: newStatus,
      updatedAt: serverTimestamp(),
    });

    const updatedSnap = await getDoc(itemRef);

    if (!updatedSnap.exists()) {
      return {
        data: null,
        error: new Error("Menu item not found after toggle"),
      };
    }

    const data = normalizeMenuItem(updatedSnap);

    console.log("✅ Item availability toggled:", data);
    return { data, error: null };
  } catch (error) {
    console.error("❌ Unexpected error toggling item availability:", error);
    return { data: null, error };
  }
}

/**
 * Compatibility helper kept for old code
 */
let cachedRestaurantId = "default";
export async function getDefaultRestaurantId() {
  return cachedRestaurantId;
}