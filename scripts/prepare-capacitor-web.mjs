
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const webDir = "dist/client";
const capacitorHtml = join(webDir, "index.capacitor.html");
const indexHtml = join(webDir, "index.html");

if (!existsSync(capacitorHtml) && !existsSync(indexHtml)) {
  console.error(
    `[capacitor] No HTML shell found in ${webDir}. Run npm run build:capacitor first.`,
  );
  process.exit(1);
}

const htmlSource = existsSync(capacitorHtml) ? capacitorHtml : indexHtml;
const html = readFileSync(htmlSource, "utf8");

// Vite must bundle the TypeScript entry into a generated JS asset.
// Capacitor cannot load the source TSX file from the APK.
if (html.includes("src/capacitor-main.tsx")) {
  console.error(
    `[capacitor] Invalid HTML entry: ${htmlSource} still references ` +
      `src/capacitor-main.tsx. Vite did not bundle the Capacitor entry.`,
  );
  process.exit(1);
}

// Find local JavaScript module files referenced by the generated HTML.
const scriptMatches = [
  ...html.matchAll(
    /<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["'][^>]*>/gi,
  ),
];

const localScripts = scriptMatches
  .map((match) => match[1])
  .filter((src) => !/^(?:[a-z]+:)?\//i.test(src));

if (localScripts.length === 0) {
  console.error(
    `[capacitor] No local module script was found in ${htmlSource}.`,
  );
  process.exit(1);
}

// Verify every locally referenced JS asset actually exists.
for (const script of localScripts) {
  const assetPath = resolve(
    webDir,
    script.replace(/^\.\//, ""),
  );

  if (!existsSync(assetPath)) {
    console.error(
      `[capacitor] Missing JS asset referenced by ${htmlSource}: ${script}`,
    );
    process.exit(1);
  }
}

// Capacitor expects index.html in webDir.
if (existsSync(capacitorHtml)) {
  copyFileSync(capacitorHtml, indexHtml);
  console.log(
    `[capacitor] Verified and wrote ${indexHtml} from ${capacitorHtml}`,
  );
} else {
  console.log(`[capacitor] Verified ${indexHtml}`);
}
