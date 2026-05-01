import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pwaConfig from "./pwa-config.js";

const isElectron = process.env.BUILD_TARGET === "electron";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      ...pwaConfig,
      disable: isElectron,
      workbox: {
        ...(pwaConfig.workbox || {}),
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],

  build: {
    target: "esnext",
    minify: false,
  },
});