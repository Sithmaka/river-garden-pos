const { BrowserWindow } = require("electron");
const { execSync } = require("child_process");
const os = require("os");

/**
 * Electron Print Service - Windows Printer Detection
 */
class PrintService {
  static async getPrinters() {
    try {
      const printerList = [
        {
          name: "System Default Printer",
          type: "system-default",
          vendor: "System",
          available: true,
        },
        {
          name: "Browser Print Dialog",
          type: "browser-dialog",
          vendor: "Browser",
          available: true,
        },
      ];

      if (os.platform() !== "win32") {
        console.log(
          "ℹ️ [PrintService] Non-Windows platform, returning defaults"
        );
        return printerList;
      }

      console.log("🖨️ [PrintService] Detecting Windows printers...");

      // Method 1: PowerShell (most reliable on modern Windows)
      try {
        console.log("🔍 [PrintService] Attempting PowerShell method...");
        const cmd = `powershell.exe -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"`;
        const output = execSync(cmd, {
          encoding: "utf-8",
          maxBuffer: 1024 * 1024 * 10,
        });
        const names = output
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n.length > 0);

        if (names.length > 0) {
          names.forEach((name) => {
            printerList.push({
              name,
              type: "system",
              vendor: "System",
              available: true,
            });
          });
          console.log(
            `✅ [PrintService] PowerShell found ${names.length} printers:`,
            names
          );
          return printerList;
        }
      } catch (e) {
        console.warn("⚠️ [PrintService] PowerShell failed:", e.message);
      }

      // Method 2: Direct command-line printer query
      try {
        console.log("🔍 [PrintService] Attempting cmd /c command...");
        const cmd = `cmd /c "for /f "tokens=*" %A in ('wmic logicalprinter get name ^| findstr /v "Name"') do @echo %A"`;
        const output = execSync(cmd, {
          encoding: "utf-8",
          shell: "cmd.exe",
          maxBuffer: 1024 * 1024 * 10,
        });
        const names = output
          .split("\n")
          .map((n) => n.trim())
          .filter((n) => n.length > 0 && n !== "Name");

        if (names.length > 0) {
          names.forEach((name) => {
            printerList.push({
              name,
              type: "system",
              vendor: "System",
              available: true,
            });
          });
          console.log(
            `✅ [PrintService] Command found ${names.length} printers:`,
            names
          );
          return printerList;
        }
      } catch (e) {
        console.warn("⚠️ [PrintService] Cmd method failed:", e.message);
      }

      // Method 3: Simple wmic query
      try {
        console.log("🔍 [PrintService] Attempting wmic method...");
        const output = execSync("wmic logicalprinter get name /format:list", {
          encoding: "utf-8",
          maxBuffer: 1024 * 1024 * 10,
        });
        const lines = output.split("\n");
        const names = [];

        lines.forEach((line) => {
          const match = line.match(/^Name=(.+)$/);
          if (match) {
            const name = match[1].trim();
            if (name) names.push(name);
          }
        });

        if (names.length > 0) {
          names.forEach((name) => {
            printerList.push({
              name,
              type: "system",
              vendor: "System",
              available: true,
            });
          });
          console.log(
            `✅ [PrintService] wmic found ${names.length} printers:`,
            names
          );
          return printerList;
        }
      } catch (e) {
        console.warn("⚠️ [PrintService] wmic method failed:", e.message);
      }

      console.warn(
        "⚠️ [PrintService] All printer detection methods failed - using defaults only"
      );
      return printerList;
    } catch (error) {
      console.error("❌ [PrintService] Error:", error);
      return [
        {
          name: "System Default Printer",
          type: "system-default",
          vendor: "System",
          available: true,
        },
        {
          name: "Browser Print Dialog",
          type: "browser-dialog",
          vendor: "Browser",
          available: true,
        },
      ];
    }
  }

  static async printSilent(printerName, htmlContent, options = {}) {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: { sandbox: true },
      });

      return new Promise((resolve, reject) => {
        printWindow.webContents.on("did-finish-load", async () => {
          try {
            await printWindow.webContents.executeJavaScript(
              `document.documentElement.innerHTML = \`${htmlContent}\`;`
            );

            const styles = `@media print { body { margin: 0; padding: 10mm; } * { color: black !important; } }`;
            await printWindow.webContents.executeJavaScript(
              `const style = document.createElement('style'); style.textContent = \`${styles}\`; document.head.appendChild(style);`
            );

            const settings = {
              silent: true,
              printBackground: true,
              deviceName:
                printerName === "System Default Printer" ? "" : printerName,
              ...options,
            };

            console.log(`🖨️ [PrintService] Silent print to: ${printerName}`);

            printWindow.webContents.print(settings, (success) => {
              printWindow.destroy();
              if (success) {
                console.log(`✅ [PrintService] Print successful`);
                resolve({
                  success: true,
                  printer: printerName,
                  timestamp: new Date().toISOString(),
                });
              } else {
                reject(new Error(`Print failed`));
              }
            });
          } catch (error) {
            printWindow.destroy();
            reject(error);
          }
        });

        printWindow.loadURL("about:blank");
      });
    } catch (error) {
      console.error("❌ [PrintService] Error:", error);
      throw error;
    }
  }

  static async printWithDialog(parentWindow, htmlContent, options = {}) {
    try {
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: { sandbox: true },
      });

      return new Promise((resolve, reject) => {
        printWindow.webContents.on("did-finish-load", async () => {
          try {
            await printWindow.webContents.executeJavaScript(
              `document.documentElement.innerHTML = \`${htmlContent}\`;`
            );

            const styles = `@media print { body { margin: 0; padding: 10mm; } * { color: black !important; } }`;
            await printWindow.webContents.executeJavaScript(
              `const style = document.createElement('style'); style.textContent = \`${styles}\`; document.head.appendChild(style);`
            );

            const settings = {
              silent: false,
              printBackground: true,
              ...options,
            };

            console.log(`🖨️ [PrintService] Print dialog`);

            printWindow.webContents.print(settings, (success) => {
              printWindow.destroy();
              resolve({
                success,
                method: "dialog",
                timestamp: new Date().toISOString(),
              });
            });
          } catch (error) {
            printWindow.destroy();
            reject(error);
          }
        });

        printWindow.loadURL("about:blank");
      });
    } catch (error) {
      console.error("❌ [PrintService] Error:", error);
      throw error;
    }
  }
}

module.exports = PrintService;
