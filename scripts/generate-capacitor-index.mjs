// Generates a static index.html in dist/client so Capacitor (native Android/iOS)
// can bundle this SSR app as a fully client-rendered SPA shell.
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const clientDir = "dist/client";
const assetsDir = join(clientDir, "assets");

if (!existsSync(assetsDir)) {
  console.error(`[capacitor] ${assetsDir} does not exist — run 'npm run build' first.`);
  process.exit(1);
}

const files = readdirSync(assetsDir);
const entryJs = files.find((f) => /^index-.*\.js$/.test(f));
const styleCss = files.find((f) => /\.css$/.test(f));

if (!entryJs) {
  console.error("[capacitor] Could not find client entry JS in dist/client/assets");
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
