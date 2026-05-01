/**
 * Service Worker Registration and PWA Helpers
 * vite-plugin-pwa automatically generates the service worker
 * This file provides utility functions for PWA features
 */

/**
 * Register service worker with auto-update
 * vite-plugin-pwa handles registration automatically with registerType: 'autoUpdate'
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.log("❌ Service Workers not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("✅ Service Worker registered:", registration);
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
  }
}

/**
 * Check for PWA install prompt
 */
export function checkPWAInstallPrompt() {
  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Dispatch custom event so components can listen for install availability
    window.dispatchEvent(
      new CustomEvent("pwa-install-ready", { detail: deferredPrompt })
    );
    console.log("✅ PWA install prompt available");
  });

  // Listen for successful installation
  window.addEventListener("appinstalled", () => {
    console.log("✅ PWA installed successfully");
    deferredPrompt = null;
  });
}

/**
 * Check if app is running as PWA
 */
export function isRunningAsPWA() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

/**
 * Check if offline
 */
export function isOffline() {
  return !navigator.onLine;
}

/**
 * Request PWA installation
 * Should be called from install button in UI
 */
export async function requestInstallPrompt() {
  const event = new Promise((resolve) => {
    window.addEventListener(
      "pwa-install-ready",
      (e) => {
        resolve(e.detail);
      },
      { once: true }
    );
  });

  const deferredPrompt = await event;
  if (!deferredPrompt) {
    throw new Error("Install prompt not available");
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  return outcome === "accepted";
}
