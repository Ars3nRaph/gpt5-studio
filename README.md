# GPT-5 Studio — CI auto-retry (20250821-045612)

## Local
```bash
npm install
copy .env.example .env.local
# mets ta vraie clé dans .env.local
npm run dev
```

## Vercel
- `vercel.json` → npm install + build.
- Node 20 (package.json/.nvmrc). Vérifie aussi dans Settings.
- Ajoute `OPENAI_API_KEY` en variable d'env.
