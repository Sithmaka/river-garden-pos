/**
 * useMenu Hook (Firebase Version)
 *
 * Custom hook for fetching and managing menu data from Firestore.
 * Provides menu items, categories, loading state, error handling,
 * optional realtime updates, and manual refetch support.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getAllMenuItems, getCategories } from "../services/menuService";
import { db } from "../services/firebase";

export function useMenu(enableRealtime = false) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const pollingRef = useRef(null);

  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        { data: items, error: itemsError },
        { data: cats, error: catsError },
      ] = await Promise.all([getAllMenuItems(), getCategories()]);

      if (itemsError) {
        throw itemsError;
      }

      if (catsError) {
        console.warn("Could not fetch categories:", catsError);
      }

      setMenuItems(items || []);
      setCategories(cats || []);
    } catch (err) {
      console.error("Unexpected error in useMenu:", err);
      setError(
        err?.message || "Unable to load menu items. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  useEffect(() => {
    if (!enableRealtime) {
      setRealtimeConnected(false);
      return;
    }

    let unsubscribeMenu = null;
    let unsubscribeCategories = null;

    try {
      const menuQuery = query(
        collection(db, "menu_items"),
        orderBy("name", "asc")
      );

      const categoriesQuery = query(
        collection(db, "menu_categories"),
        orderBy("name", "asc")
      );

      unsubscribeMenu = onSnapshot(
        menuQuery,
        async () => {
          setRealtimeConnected(true);
          await fetchMenuItems();
        },
        (err) => {
          console.error("[useMenu] menu_items realtime error:", err);
          setRealtimeConnected(false);
        }
      );

      unsubscribeCategories = onSnapshot(
        categoriesQuery,
        async () => {
          setRealtimeConnected(true);
          await fetchMenuItems();
        },
        (err) => {
          console.error("[useMenu] menu_categories realtime error:", err);
          setRealtimeConnected(false);
        }
      );
    } catch (err) {
      console.error("[useMenu] Error setting up realtime listeners:", err);
      setRealtimeConnected(false);
    }

    return () => {
      if (unsubscribeMenu) unsubscribeMenu();
      if (unsubscribeCategories) unsubscribeCategories();
      setRealtimeConnected(false);
    };
  }, [enableRealtime, fetchMenuItems]);

  useEffect(() => {
    if (!enableRealtime || realtimeConnected) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    pollingRef.current = setInterval(() => {
      fetchMenuItems();
    }, 60000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [enableRealtime, realtimeConnected, fetchMenuItems]);

  return {
    menuItems,
    categories,
    loading,
    error,
    refetch: fetchMenuItems,
    realtimeConnected,
  };
}