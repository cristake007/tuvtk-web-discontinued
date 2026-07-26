import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const buildOutDir = process.env.VITE_BUILD_OUT_DIR ?? "dist";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: buildOutDir,
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules\/(?:react|react-dom|scheduler)\//,
              priority: 50,
            },
            {
              name: "router-vendor",
              test: /node_modules\/(?:react-router|react-router-dom)\//,
              priority: 40,
            },
            {
              name: "query-vendor",
              test: /node_modules\/@tanstack\//,
              priority: 40,
            },
            {
              name: "base-ui-vendor",
              test: /node_modules\/(?:@base-ui|@floating-ui)\//,
              maxSize: 240_000,
              priority: 30,
            },
            {
              name: "icons-vendor",
              test: /node_modules\/lucide-react\//,
              priority: 20,
            },
            {
              name: "vendor",
              test: /node_modules\//,
              maxSize: 240_000,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:8000",
      },
      "^/admin(?:/|$)": {
        target: "http://backend:8000",
      },
      "/media": {
        target: "http://backend:8000",
      },
      "/static": {
        target: "http://backend:8000",
      },
    },
  },
});
