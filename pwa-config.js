/**
 * PWA Configuration
 * Minimal setup following official vite-plugin-pwa guide
 * https://vite-pwa-org.netlify.app/guide/
 */

export default {
  registerType: "autoUpdate",
  manifest: {
    name: "CodeBell POS",
    short_name: "CodeBell",
    description: "Restaurant POS System with Direct Printer Support",
    theme_color: "#14b8a6",
    background_color: "#ffffff",
    display: "standalone",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  devOptions: {
    enabled: false,
  },
  workbox: {
    mode: "production",
    cleanupOutdatedCaches: true,
    skipWaiting: true,
  },
};
