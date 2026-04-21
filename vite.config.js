import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/deco-3d/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        scene3d: resolve(__dirname, "3D.html"),
      },
    },
  },
});