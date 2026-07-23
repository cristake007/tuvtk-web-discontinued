import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const buildOutDir = process.env.VITE_BUILD_OUT_DIR ?? "dist";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: buildOutDir,
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://backend:8000",
      },
      "/admin": {
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
