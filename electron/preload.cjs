const { contextBridge, ipcRenderer } = require("electron");

/**
 * Preload script - safely exposes Electron IPC to React app
 * This runs in a special context with limited access to Electron APIs
 */
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Get available printers
   */
  getPrinters: () => ipcRenderer.invoke("print:getPrinters"),

  /**
   * Silent print to specific printer (no dialog)
   */
  printSilent: (printerName, htmlContent, options) =>
    ipcRenderer.invoke("print:silent", { printerName, htmlContent, options }),

  /**
   * Print with system dialog
   */
  printWithDialog: (htmlContent, options) =>
    ipcRenderer.invoke("print:dialog", { htmlContent, options }),

  /**
   * Get environment info (useful for debugging)
   */
  getEnv: () => ({
    isDev: process.env.NODE_ENV === "development",
    platform: process.platform,
    arch: process.arch,
  }),

  /**
   * Update listeners - returns unsubscribe function
   */
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update:available", callback);
    return () => ipcRenderer.removeListener("update:available", callback);
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.on("update:downloaded", callback);
    return () => ipcRenderer.removeListener("update:downloaded", callback);
  },

  onUpdateError: (callback) => {
    const listener = (event, error) => callback(error);
    ipcRenderer.on("update:error", listener);
    return () => ipcRenderer.removeListener("update:error", listener);
  },

  /**
   * Restart app to install update
   */
  restartForUpdate: () => ipcRenderer.send("app:restart-for-update"),
});

console.log("✅ Electron preload script loaded");
