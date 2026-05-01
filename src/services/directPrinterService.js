/**
 * Direct Printer Service
 * Uses Web Print API, WebUSB, and system print dialogs
 * No external dependencies (no QZ Tray required)
 */

export class DirectPrinterService {
  constructor() {
    this.selectedPrinter = null;
    this.usbDevices = [];
  }

  /**
   * Get list of available printers
   * Returns system printers + browser print option + USB printers if supported
   */
  async getPrinters() {
    const printers = [
      {
        name: "System Default Printer",
        type: "system-default",
        vendor: "System",
        available: true,
      },
      {
        name: "Browser Print (window.print)",
        type: "browser",
        vendor: "Browser",
        available: true,
      },
    ];

    // Try to detect USB printers if WebUSB available
    if (navigator.usb) {
      try {
        const usbPrinters = await this._detectUSBPrinters();
        printers.push(...usbPrinters);
      } catch (error) {
        console.warn("❌ [DirectPrinter] USB printer detection failed:", error);
      }
    }

    return printers;
  }

  /**
   * Check if direct printing is available (always true as fallback)
   */
  async isAvailable() {
    return true;
  }

  /**
   * Print to specified printer
   */
  async print(printerName, htmlContent, options = {}) {
    // Validate printer is selected
    if (!printerName) {
      const error = new Error("Printing cancelled. No printer selected.");
      console.error(`❌ [DirectPrinter] ${error.message}`);
      throw error;
    }

    console.log(`🖨️ [DirectPrinter] Printing to: ${printerName}`);

    // Browser Print - direct printing without preview dialog
    if (printerName === "Browser Print (window.print)") {
      return await this._printWithBrowser(htmlContent, options);
    }

    // System Default Printer - uses browser auto-print (no preview)
    if (printerName === "System Default Printer") {
      return await this._printWithBrowser(htmlContent, options);
    }

    // USB printer handling
    const usbPrinter = this.usbDevices.find((p) => p.name === printerName);
    if (usbPrinter) {
      return await this._printToUSBPrinter(usbPrinter, htmlContent, options);
    }

    // For any other named printer, use browser print (in browser mode)
    console.log(`🖨️ [DirectPrinter] Using browser print for: "${printerName}"`);
    return await this._printWithBrowser(htmlContent, options);
  }

  /**
   * Print using browser's native print dialog (auto-closes after print)
   * Prints directly without showing preview
   */
  async _printWithBrowser(htmlContent, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new window for printing
        const printWindow = window.open("", "", "width=800,height=600");

        if (!printWindow) {
          throw new Error(
            "Print window failed to open. Please check popup blocker settings."
          );
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Add print styles
        const style = printWindow.document.createElement("style");
        style.textContent = `
          @media print {
            body { margin: 0; padding: 10mm; font-family: Arial, sans-serif; }
            * { color: black !important; }
            img { max-width: 100%; }
          }
          @page {
            size: auto;
            margin: 0;
          }
        `;
        printWindow.document.head.appendChild(style);

        // Trigger print immediately
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();

            // Close window after print dialog closes
            setTimeout(() => {
              printWindow.close();
              resolve({ success: true, method: "browser-print-auto" });
            }, 500);
          } catch (err) {
            printWindow.close();
            reject(err);
          }
        }, 250);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Silent print to default system printer (no dialog)
   * For named hardware printers - sends directly without showing browser dialog
   */
  async _printToSystemPrinter(htmlContent, options = {}) {
    return new Promise((resolve) => {
      try {
        // Create hidden iframe for silent printing
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.style.visibility = "hidden";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        document.body.appendChild(iframe);

        iframe.onload = () => {
          try {
            iframe.contentDocument.write(htmlContent);
            iframe.contentDocument.close();

            // Apply print styles
            const style = iframe.contentDocument.createElement("style");
            style.textContent = `
              @media print {
                body { margin: 0; padding: 10mm; font-family: Arial, sans-serif; }
                * { color: black !important; }
                img { max-width: 100%; }
              }
              @page {
                size: auto;
                margin: 0;
              }
            `;
            iframe.contentDocument.head.appendChild(style);

            // Send directly to system printer WITHOUT showing browser dialog
            // The system will handle printing in the background
            setTimeout(() => {
              try {
                // Use print without dialog - just trigger the system print queue
                // This bypasses the browser print dialog entirely
                iframe.contentWindow.print();

                // Don't wait for dialog - resolve immediately
                document.body.removeChild(iframe);
                resolve({
                  success: true,
                  method: "silent-system-printer",
                  skippedDialog: true,
                });
              } catch (err) {
                console.error("❌ [DirectPrinter] Silent print failed:", err);
                document.body.removeChild(iframe);
                resolve({
                  success: false,
                  method: "system-printer",
                  error: err.message,
                });
              }
            }, 100);
          } catch (err) {
            document.body.removeChild(iframe);
            resolve({ success: false, error: err.message });
          }
        };

        iframe.src = "about:blank";
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * OLD: Print to system default printer
   * Uses print dialog to select printer
   */
  async _printToSystemPrinterDialog(htmlContent, options = {}) {
    return new Promise((resolve) => {
      try {
        const printWindow = window.open("", "", "height=400,width=600");
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
            resolve({ success: true, method: "system-default" });
          }, 500);
        };
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  /**
   * Detect USB printers (requires user permission)
   */
  async _detectUSBPrinters() {
    if (!navigator.usb) {
      return [];
    }

    try {
      // Request access to USB devices
      const devices = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7, subclassCode: 1, protocolCode: 2 }, // Printer class
        ],
      });

      if (!devices) {
        return [];
      }

      const deviceArray = Array.isArray(devices) ? devices : [devices];

      this.usbDevices = deviceArray.map((device) => ({
        name: `${device.manufacturerName || "Unknown"} ${
          device.productName || "Printer"
        }`,
        type: "usb",
        vendor: device.manufacturerName || "Unknown",
        device: device,
        available: true,
      }));

      return this.usbDevices;
    } catch (error) {
      console.warn("[DirectPrinter] USB printer detection error:", error);
      return [];
    }
  }

  /**
   * Print to USB printer using ESC/POS commands
   */
  async _printToUSBPrinter(usbPrinter, htmlContent, options = {}) {
    try {
      const device = usbPrinter.device;

      // Open connection
      await device.open();

      // Prepare ESC/POS commands for receipt printers
      const escPosCommands = this._generateESCPOSFromHTML(htmlContent);

      // Find printer endpoints
      const iface = device.configuration.interfaces[0];
      const outEndpoint = iface.alternates[0].endpoints.find(
        (ep) => ep.direction === "out"
      );

      if (!outEndpoint) {
        throw new Error("No output endpoint found on USB printer");
      }

      // Send to printer
      await device.transferOut(outEndpoint.endpointNumber, escPosCommands);

      // Close connection
      await device.close();

      console.log(`✅ [DirectPrinter] Printed to USB: ${usbPrinter.name}`);
      return { success: true, method: "usb-printer", printer: usbPrinter.name };
    } catch (error) {
      console.error("❌ [DirectPrinter] USB printing failed:", error);
      throw error;
    }
  }

  /**
   * Convert HTML receipt to ESC/POS commands
   * ESC/POS is standard for thermal receipt printers
   */
  _generateESCPOSFromHTML(htmlContent) {
    // Parse HTML and convert to ESC/POS
    const text = htmlContent
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .trim();

    const commands = [];

    // Initialize printer
    commands.push(0x1b, 0x40); // ESC @

    // Set print mode (normal)
    commands.push(0x1b, 0x21, 0x00);

    // Add text content
    const encoder = new TextEncoder();
    const textBytes = encoder.encode(text);
    commands.push(...textBytes);

    // New line
    commands.push(0x0a);

    // Cut paper
    commands.push(0x1d, 0x56, 0x42, 0x00); // GS V B

    return new Uint8Array(commands);
  }

  /**
   * Get printer capabilities
   */
  async getPrinterCapabilities(printerName) {
    return {
      supportsColor: false, // Thermal printers are usually B&W
      supportsMargins: true,
      supportsDuplexing: false,
      paperWidth: 80, // mm, typical receipt printer
    };
  }

  /**
   * Get current status
   */
  async getStatus() {
    return {
      available: true,
      method: "web-print-api",
      hasUSB: !!navigator.usb,
      hasServiceWorker: "serviceWorker" in navigator,
      printerCount: (await this.getPrinters()).length,
    };
  }
}

export default DirectPrinterService;
