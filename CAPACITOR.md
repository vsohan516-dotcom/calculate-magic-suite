# Build Lumen Calc as an Android APK

This project is wired up with [Capacitor](https://capacitorjs.com) so you can
package the web app into a real Android `.apk` / `.aab`.

The native `android/` folder is **not** committed — Capacitor generates it on
your machine. You need Android Studio (with the Android SDK) installed.

## One-time setup

```bash
# 1. Clone your repo and install deps
git clone https://github.com/vsohan516-dotcom/<your-repo>.git
cd <your-repo>
bun install        # or: npm install

# 2. Build Android web assets (outputs to dist/client)
bun run build:capacitor      # or: npm run build:capacitor

# 3. Generate the native Android project
npx cap add android

# 4. Sync web assets into the Android project
npx cap sync android
```

## Every time you change web code

```bash
bun run build:capacitor
npx cap sync android
```

## Open in Android Studio and build the APK

```bash
npx cap open android
```

Then in Android Studio:

- **Build → Build Bundle(s) / APK(s) → Build APK(s)** → produces a debug APK
  under `android/app/build/outputs/apk/debug/app-debug.apk`.
- For a release APK / Play Store AAB, configure a keystore under
  **Build → Generate Signed Bundle / APK**.

## Run on a connected device / emulator

```bash
npx cap run android
```

## Troubleshooting: app installs but shows a blank / broken UI

1. **Always use the Capacitor build, then sync.** Do NOT skip `build:capacitor`:

   ```bash
   npm run build:capacitor   # or: bun run build:capacitor
   npx cap sync android
   ```

   If you run the normal `npm run build` (SSR) instead, `dist/client` may not
   contain the correct client shell and the app opens blank. Rebuild with
   `build:capacitor` and clear the Android cache before reinstalling
   (`./gradlew clean` inside the `android/` folder, or uninstall/reinstall the
   APK).

2. **WebView version.** The app's CSS (Tailwind v4) uses modern colour features
   (`oklch()`, `color-mix()`, `@property`) that need **Android System WebView
   111+ / Chrome 111+** (roughly Android 13+ with updated WebView). On older
   WebView versions the theme can fail to render. Fixes:
   - Update **Android System WebView** in the Play Store, or
   - Test on an Android 13+ device / emulator, or
   - The project ships a solid-colour CSS fallback (see `src/styles.css`) that
     keeps the app readable on older WebViews, but the prettiest result needs a
     modern WebView.

3. **The app renders fully offline** — history, converters, and tools all work
   without a network. Only live currency rates and the GitHub sync widget need
   internet.

4. **A blank screen now explains itself.** `index.capacitor.html` ships a small
   ES5 watchdog that paints the real failure on the device instead of leaving a
   bare `#1a1530` background:

   - a JS throw during startup → **"Startup error"** with the message,
   - a crash while React renders → **"App crashed while rendering"** with the
     component stack (error boundary in `src/capacitor-main.tsx`),
   - the bundle parses but draws nothing within 10 s → **"App did not render"**.

   Each panel also prints the WebView user-agent, so the Chrome/WebView version
   is readable straight off a screenshot. If you see one of these, the text on
   the panel _is_ the diagnosis — send it as-is.

## Notes

- App ID: `app.lovable.lumencalc` (change in `capacitor.config.ts` before the
  first `cap add android` if you want a different package name).
- `webDir` points at `dist/client`. Android uses a dedicated static Vite build
  (`build:capacitor`) so the app opens correctly inside the native WebView.
- The Capacitor build transpiles modern JS down (`build.target: es2018`) and
  injects small polyfills (see `src/capacitor-polyfills.ts`) so older Android
  WebView versions can at least start the app instead of showing a blank
  screen.
