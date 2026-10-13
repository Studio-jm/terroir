# Terroir

Next.js App Router + TypeScript (strict). Auth will live in `app/(auth)/` later.

Public exploitation page: `/e/[slug]` (demo: `/e/ferme-du-serre`).

Producer accounts: `/inscription`, `/connexion`, `/espace` (Supabase Auth, e-mail and password). The signed-in producer creates and edits one exploitation; it shows on the home page and at `/e/[slug]`, next to the demo fiches.

```bash
npm i
npm run dev
npm run build
```

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, the site still builds and shows the demo exploitations. Account pages explain that Supabase is not configured. See `.env.example`. Schema: `supabase/migrations`.
