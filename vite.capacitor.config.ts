import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    // Transpile modern JS (optional chaining, nullish coalescing, logical
    // assignment) down so older Android System WebView versions can run the
    // app. Tailwind v4 output still needs a fairly recent WebView (Chrome 111+)
    // for oklch()/color-mix()/@property, so we ALSO ship a solid-colour CSS
    // fallback (see src/styles.css).
    target: "es2018",
    cssTarget: "chrome111",
    rollupOptions: {
      input: {
        index: "index.capacitor.html",
      },
    },
  },
});
