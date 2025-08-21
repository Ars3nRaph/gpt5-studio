# GPT-5 Studio — PostCSS CJS fix (20250821-050449)

- Corrige l'erreur Vercel: *"ReferenceError: module is not defined in ES module scope"* en remplaçant `postcss.config.js` par **`postcss.config.cjs`**.
- Node 20 + npm install, imports relatifs, pas de 'sk-' dans les sources.

## Local
```bash
npm install
copy .env.example .env.local
npm run dev
```

## Vercel
- `vercel.json` → npm install + build
- Node 20 (Settings)
- Ajoute `OPENAI_API_KEY` en env
