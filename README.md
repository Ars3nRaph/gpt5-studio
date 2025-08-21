# GPT-5 Studio — Fix File Purpose (20250821-054351)

- Corrige l'erreur TS: `"file_search" is not assignable to type 'FilePurpose'` en mettant `purpose: "assistants"` et en utilisant `new File([buf], name)`.
- Toujours: Node 20 + npm install, imports relatifs, postcss.config.cjs.

## Local
```
npm install
copy .env.example .env.local
npm run dev
```

## Vercel
- `vercel.json` → npm install + build
- Node 20 (Settings)
- Env var: OPENAI_API_KEY
```
