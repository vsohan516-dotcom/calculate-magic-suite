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

## Notes

- App ID: `app.lovable.lumencalc` (change in `capacitor.config.ts` before the
  first `cap add android` if you want a different package name).
- `webDir` points at `dist/client`. Android uses a dedicated static Vite build
  (`build:capacitor`) so the app opens correctly inside the native WebView.
- The app runs fully offline once installed — all calculator logic, history,
  converters, and tools work without a network. Live currency rates still
  require internet.
