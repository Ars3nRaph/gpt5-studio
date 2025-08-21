# GPT-5 Studio — Final Vercel CJS (20250821-052324)

- **postcss.config.cjs** uniquement (aucun `postcss.config.js`).
- Node 20 + npm install.
- Imports relatifs, pas de 'sk-' dans les sources.

## Important
Si ton repo contient encore `postcss.config.js`, supprime-le avec :
```
git rm -f postcss.config.js
git commit -m "chore: remove old postcss.config.js"
git push origin main
```

## Local
```
npm install
copy .env.example .env.local
npm run dev
```

## Vercel
- Settings → Node.js Version: 20.x
- Env var: OPENAI_API_KEY
- Redeploy
