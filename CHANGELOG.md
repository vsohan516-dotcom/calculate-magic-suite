# Changelog

## Unreleased

- fix(dev): allow the Arena/Lovable preview hostnames so the dev server no longer
  answers `403 Blocked request. This host is not allowed.` and renders a blank
  preview (vite.config.ts `server.allowedHosts`)
- fix(theme): guard `localStorage`/`matchMedia` in `useTheme` — a throw there had
  no error boundary above it and unmounted the whole app to a blank screen
  (src/hooks/use-theme.ts)
- fix(vault): guard vault `localStorage` reads/writes against blocked storage
  (src/lib/vault.ts)
- feat(capacitor): on-device boot diagnostics — startup error handler, React
  error boundary and a 10 s "did not render" watchdog that print the real cause
  plus the WebView version instead of a blank screen
  (index.capacitor.html, src/capacitor-main.tsx)
- feat(chem): add periodic table backend (src/lib/chemistry/periodicTable.ts)
- feat(chem-ui): add Chemistry UI and wire into CalculatorApp (src/components/calculator/Chemistry.tsx, CalculatorApp.tsx)
