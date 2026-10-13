# Terroir

Next.js App Router + TypeScript (strict). Auth will live in `app/(auth)/` later.

Public exploitation page: `/e/[slug]` (demo: `/e/ferme-du-serre`).

Producer accounts: `/inscription`, `/connexion`, `/espace`. Magic link, no password.

```bash
npm i
npm run dev
npm run build
```

Local and CI need no secrets: accounts are stored in `.data/store.json`, and the sign-in link is printed in the server console (and shown on the page in development).

Production on Vercel needs `AUTH_SECRET`, `DATABASE_URL` (Neon Postgres), `RESEND_API_KEY` and `EMAIL_FROM`. See `.env.example`. The app creates its tables on first use.
