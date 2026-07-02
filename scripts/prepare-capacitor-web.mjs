import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const webDir = "dist/client";
const capacitorHtml = join(webDir, "index.capacitor.html");
const indexHtml = join(webDir, "index.html");

if (!existsSync(capacitorHtml) && !existsSync(indexHtml)) {
  console.error(`[capacitor] No HTML shell found in ${webDir}. Run npm run build:capacitor first.`);
  process.exit(1);
}

if (existsSync(capacitorHtml)) {
  copyFileSync(capacitorHtml, indexHtml);
  console.log(`[capacitor] Wrote ${indexHtml} from ${capacitorHtml}`);
} else {
  console.log(`[capacitor] ${indexHtml} already exists`);
}