// Generates a static index.html in the client output dir so Capacitor
// (native Android/iOS) can bundle this SSR app as a fully client-rendered SPA shell.
import { readdirSync, writeFileSync, existsSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";

// Try known client output locations (varies by nitro preset).
const candidates = ["dist/client", ".output/public"];
let clientDir = candidates.find((d) => existsSync(join(d, "assets")));

if (!clientDir) {
  console.error(
    `[capacitor] No client build found. Looked in: ${candidates.join(", ")}. Run 'npm run build' first.`,
  );
  process.exit(1);
}

console.log(`[capacitor] Using client dir: ${clientDir}`);

const assetsDir = join(clientDir, "assets");
const files = readdirSync(assetsDir);
const entryJs = files.find((f) => /^index-.*\.js$/.test(f));
const styleCss = files.find((f) => /\.css$/.test(f));

if (!entryJs) {
  console.error("[capacitor] Could not find client entry JS in " + assetsDir);
  console.error("[capacitor] Files present: " + files.join(", "));
  process.exit(1);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <title>Lumen Calc</title>
    <link rel="manifest" href="/manifest.webmanifest" />
    ${styleCss ? `<link rel="stylesheet" href="/assets/${styleCss}" />` : ""}
    <script type="module" crossorigin src="/assets/${entryJs}"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

writeFileSync(join(clientDir, "index.html"), html);
console.log(`[capacitor] Wrote ${clientDir}/index.html (entry: ${entryJs})`);

// Capacitor's config expects webDir at dist/client. If the build produced
// .output/public instead, mirror it so `npx cap sync` finds the assets.
if (clientDir !== "dist/client") {
  mkdirSync("dist", { recursive: true });
  cpSync(clientDir, "dist/client", { recursive: true });
  console.log(`[capacitor] Mirrored ${clientDir} -> dist/client for Capacitor sync`);
}
