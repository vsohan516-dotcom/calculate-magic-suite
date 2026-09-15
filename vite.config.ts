// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
// - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
// componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
// error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
export default defineConfig({
  vite: {
    base: "./",
    server: {
      // Vite 8 rejects every request whose Host header is not localhost or a
      // bare IP address with `403 Blocked request. This host is not allowed.`
      // The Arena preview (`{port}-{sandbox}.e2b.app`) and the Lovable preview
      // (`*.lovable.app`, `*.lovableproject.com`) both proxy the dev server
      // under their own hostnames, so without this list the request never even
      // reaches SSR and the preview renders as a blank screen. A leading dot
      // matches the domain and all of its subdomains.
      allowedHosts: [".e2b.app", ".lovable.app", ".lovableproject.com"],
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
