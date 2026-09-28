import { defineConfig } from "vite";

export default defineConfig({
  // Rutas relativas: el mismo dist funciona en raíz, subcarpetas y GitHub Pages.
  base: "./",
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});
