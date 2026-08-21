# INSTALL.md

Batch 1 changes — Testing & Local install instructions

These instructions assume you already have the project cloned and that you did not modify any build or platform configuration.

1. Ensure dependencies are installed
   - This project uses the existing package manager configured in the repository. From the project root run one of the existing commands (do NOT modify package.json):
     - npm install
     - or yarn install
     - or bun install

2. Start the development server
   - npm run dev
   - or yarn dev
   - or bun run dev

3. Build for production
   - npm run build
   - or yarn build
   - or bun run build

4. Test the new tools in the app UI
   - Open the app in the browser at the address printed by the dev server (commonly http://localhost:5173).
   - On the main page, open the Tools tab and verify these new tiles exist:
     - Password
     - Random
     - Base Converter
     - Roman Numerals
     - ASCII / Unicode

5. Notes & troubleshooting
   - No new dependencies or native plugins were added in Batch 1. If you see missing UI primitives it means the existing component library in the repo was changed — restore it from the original repository.
   - If copy-to-clipboard fails, ensure your browser supports navigator.clipboard and you are serving the site over secure context (localhost qualifies).
