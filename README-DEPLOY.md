# Correctifs Vercel (Node 20 + npm) — CLEAN

Ce pack évite le blocage GitHub Push Protection (pas de motif 'sk-').

## Appliquer
1) Copiez à la **racine** du projet : `package.json`, `vercel.json`, `.nvmrc`, `.env.example`
2) Commit & push :
   git add package.json vercel.json .nvmrc .env.example
   git commit -m "chore: pin Node 20 & use npm on Vercel (clean)"
   git push origin main
3) Sur Vercel → Redeploy.
