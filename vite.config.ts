import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { PWA_NAVIGATION_FALLBACK_DENYLIST } from "./src/services/pwa-navigation";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.png",
        "brand/logo-antifake.png",
        "pwa/*.png",
        "pwa/*.svg",
      ],
      manifest: {
        name: "AntiFake",
        short_name: "AntiFake",
        description:
          "Mua sắm thông minh, truy xuất nguồn gốc và nói không với hàng giả.",
        theme_color: "#b91c1c",
        background_color: "#fff7f6",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        lang: "vi-VN",
        icons: [
          {
            src: "/pwa/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html}"],
        navigateFallbackDenylist: PWA_NAVIGATION_FALLBACK_DENYLIST,
        runtimeCaching: [],
      },
    }),
  ],
});
