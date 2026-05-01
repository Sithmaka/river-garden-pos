import { useState, useEffect } from "react";
import {
  getPrinterConfiguration,
  subscribeToPrinterConfiguration,
} from "../services/printerConfigService";

/**
 * Custom hook to use printer configuration with real-time updates
 * Syncs across dashboards when admin changes printer settings
 */
export function usePrinterConfiguration() {
  const [config, setConfig] = useState({
    customerPrinter: null,
    kitchenPrinter: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;

    async function init() {
      try {
        setLoading(true);

        // Initial load
        const printerConfig = await getPrinterConfiguration();

        setConfig({
          customerPrinter: printerConfig?.customerReceiptPrinter || null,
          kitchenPrinter: printerConfig?.kitchenOrderPrinter || null,
        });

        console.log("✅ [usePrinterConfiguration] Initial configuration loaded");

        // Realtime subscription
        unsubscribe = await subscribeToPrinterConfiguration((updatedConfig) => {
          console.log(
            "🔄 [usePrinterConfiguration] Realtime configuration update:",
            updatedConfig
          );

          setConfig({
            customerPrinter: updatedConfig?.customerReceiptPrinter || null,
            kitchenPrinter: updatedConfig?.kitchenOrderPrinter || null,
          });
        });

      } catch (err) {
        console.error(
          "❌ [usePrinterConfiguration] Failed to load configuration:",
          err
        );

        setError(err.message || "Failed to load printer configuration");
      } finally {
        setLoading(false);
      }
    }

    init();

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  return {
    customerPrinter: config.customerPrinter,
    kitchenPrinter: config.kitchenPrinter,
    loading,
    error,
  };
}

export default usePrinterConfiguration;