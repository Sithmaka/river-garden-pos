const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const printService = require("./services/printService.cjs");
const { isDev, appUrl } = require("./config.cjs");

let mainWindow;

// Configure auto-updater (only in production)
if (!isDev) {
  autoUpdater.checkForUpdatesAndNotify();

  // Check for updates on startup and every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
}

// Handle update events
autoUpdater.on("update-available", () => {
  console.log("🔄 Update available - downloading...");
  mainWindow?.webContents.send("update:available");
});

autoUpdater.on("update-downloaded", () => {
  console.log("✅ Update downloaded - ready to install");
  mainWindow?.webContents.send("update:downloaded");
  // Auto-restart in 10 seconds
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 10000);
});

autoUpdater.on("error", (err) => {
  console.error("❌ Update error:", err);
  mainWindow?.webContents.send("update:error", err.message);
});

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, "../public/icons/icon-512x512.png"),
  });

  // Load from config (localhost in dev, production domain in production)
  console.log(`🚀 Loading app from: ${appUrl}`);
  mainWindow.loadURL(appUrl);

  // Uncomment the line below to enable DevTools for debugging
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * IPC Handler: Restart app to install update
 */
ipcMain.on("app:restart-for-update", () => {
  autoUpdater.quitAndInstall();
});

/**
 * IPC Handler: Get list of available printers
 */
ipcMain.handle("print:getPrinters", async () => {
  try {
    const printers = await printService.getPrinters();
    return { success: true, data: printers };
  } catch (error) {
    console.error("❌ [Electron] Error getting printers:", error);
    return { success: false, error: error.message };
  }
});

/**
 * IPC Handler: Print to specified printer (SILENT - no dialog)
 */
ipcMain.handle(
  "print:silent",
  async (event, { printerName, htmlContent, options }) => {
    try {
      console.log(`🖨️ [Electron] Silent print to: ${printerName}`);

      const result = await printService.printSilent(
        printerName,
        htmlContent,
        options
      );

      return { success: true, data: result };
    } catch (error) {
      console.error("❌ [Electron] Silent print error:", error);
      return { success: false, error: error.message };
    }
  }
);

/**
 * IPC Handler: Print with dialog (user selects printer)
 */
ipcMain.handle("print:dialog", async (event, { htmlContent, options }) => {
  try {
    console.log(`🖨️ [Electron] Print with dialog`);

    const result = await printService.printWithDialog(
      mainWindow,
      htmlContent,
      options
    );

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Electron] Print dialog error:", error);
    return { success: false, error: error.message };
  }
});

/**
 * App Event Handlers
 */
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle squirrel installer events on Windows
if (require("electron-squirrel-startup")) {
  app.quit();
}
