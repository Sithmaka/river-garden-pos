/**
 * Electron Printer Service
 * Bridge between React and Electron for silent printing
 * Only works when running in Electron environment
 */

const isElectron = () => {
  return typeof window !== "undefined" && window.electronAPI;
};

export class ElectronPrinterService {
  constructor() {
    this.available = isElectron();
    console.log(`🖨️ [ElectronPrinterService] Available: ${this.available}`);
  }

  /**
   * Check if Electron is available
   */
  async isAvailable() {
    return this.available;
  }

  /**
   * Get list of available printers
   */
  async getPrinters() {
    if (!this.available) {
      console.warn("⚠️ [ElectronPrinterService] Not in Electron environment");
      return [];
    }

    try {
      const result = await window.electronAPI.getPrinters();
      if (result.success) {
        console.log(
          `✅ [ElectronPrinterService] Got ${result.data.length} printers`
        );
        return result.data;
      } else {
        console.error("❌ [ElectronPrinterService] Error:", result.error);
        return [];
      }
    } catch (error) {
      console.error(
        "❌ [ElectronPrinterService] Error getting printers:",
        error
      );
      return [];
    }
  }

  /**
   * Silent print to specified printer (no dialog)
   */
  async printSilent(printerName, htmlContent, options = {}) {
    if (!this.available) {
      throw new Error("Electron not available");
    }

    try {
      console.log(
        `🖨️ [ElectronPrinterService] Silent print to: ${printerName}`
      );

      const result = await window.electronAPI.printSilent(
        printerName,
        htmlContent,
        options
      );

      if (result.success) {
        console.log(
          `✅ [ElectronPrinterService] Print successful:`,
          result.data
        );
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ [ElectronPrinterService] Silent print error:", error);
      throw error;
    }
  }

  /**
   * Print with dialog (user selects printer)
   */
  async printWithDialog(htmlContent, options = {}) {
    if (!this.available) {
      throw new Error("Electron not available");
    }

    try {
      console.log(`🖨️ [ElectronPrinterService] Print dialog`);

      const result = await window.electronAPI.printWithDialog(
        htmlContent,
        options
      );

      if (result.success || result.cancelled) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("❌ [ElectronPrinterService] Print dialog error:", error);
      throw error;
    }
  }

  /**
   * Print to default printer (silent)
   * Convenience method
   */
  async printDefault(htmlContent, options = {}) {
    return this.printSilent("System Default Printer", htmlContent, options);
  }
}

// Singleton instance
export const electronPrinterService = new ElectronPrinterService();

export default ElectronPrinterService;
