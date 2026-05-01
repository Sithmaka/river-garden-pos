/**
 * Printer Service
 * Single entry point for all printing operations
 * Automatically uses Electron for silent printing when available
 * Falls back to Direct API (Web Print API) in browser mode
 */

import { DirectPrinterService } from "./directPrinterService";
import { ElectronPrinterService } from "./electronPrinterService";

export class PrinterService {
  constructor() {
    // Check if running in Electron
    const isElectron = typeof window !== "undefined" && window.electronAPI;

    this.isElectron = isElectron;
    this.electronService = isElectron ? new ElectronPrinterService() : null;
    this.directService = new DirectPrinterService();
    this.initialized = false;

    console.log(`🖨️ [PrinterService] Electron mode: ${isElectron}`);
  }

  /**
   * Initialize the printer service
   */
  async initialize() {
    console.log("🖨️ [PrinterService] Initializing...");
    this.initialized = true;

    if (this.isElectron && this.electronService) {
      console.log("✅ [PrinterService] Using Electron for silent printing");
    } else {
      console.log("✅ [PrinterService] Using browser-based printing");
      await this.directService.getStatus();
    }

    return { initialized: true, electron: this.isElectron };
  }

  /**
   * Get all available printers
   */
  async getPrinters() {
    if (!this.initialized) await this.initialize();

    // Use Electron printers if available
    if (this.isElectron && this.electronService) {
      return await this.electronService.getPrinters();
    }

    // Fall back to web API
    return await this.directService.getPrinters();
  }

  /**
   * Print to specified printer
   */
  async print(printerName, htmlContent, options = {}) {
    if (!this.initialized) await this.initialize();

    // Use Electron for silent printing
    if (this.isElectron && this.electronService) {
      console.log(`🖨️ [PrinterService] Using Electron silent print`);
      return await this.electronService.printSilent(
        printerName,
        htmlContent,
        options
      );
    }

    // Fall back to web API
    return await this.directService.print(printerName, htmlContent, options);
  }

  /**
   * Get printer capabilities
   */
  async getPrinterCapabilities(printerName) {
    if (!this.initialized) await this.initialize();

    if (this.isElectron) {
      return { name: printerName, electron: true };
    }

    return await this.directService.getPrinterCapabilities(printerName);
  }

  /**
   * Get service status
   */
  async getStatus() {
    if (this.isElectron && this.electronService) {
      return {
        mode: "electron",
        available: await this.electronService.isAvailable(),
      };
    }
    return await this.directService.getStatus();
  }

  /**
   * Refresh printer list
   */
  async refreshPrinters() {
    return await this.getPrinters();
  }
}

// Singleton instance
export const printerService = new PrinterService();

export default PrinterService;
