# Zannid & Co. website

Astro 5 · Three.js · Supabase · Vercel. Static pages + one serverless function (`/api/lead`).

## 1. Edit your details (one file)
`src/data/site.ts` holds the WhatsApp number, email, offer, prices, reel stats, plan targets and services.
Add the three reel covers to `public/assets/` as `ig-biryani.jpg`, `ig-cafe.jpg`, `ig-hello.jpg`.

## 2. Run locally
```bash
npm install
npm run dev        # http://localhost:4321
```

## 3. Database (Supabase)
1. Create a project at supabase.com.
2. SQL Editor → run `supabase/schema.sql` (creates the locked `leads` table).
3. Project Settings → API → copy the Project URL and the `service_role` key.
4. Copy `.env.example` to `.env` and paste both values for local testing.
View leads anytime in Supabase → Table Editor → `leads`.
If the keys are missing, the form still works: it shows a "Send it on WhatsApp instead" fallback.

## 4. Deploy to Vercel
1. Push this folder to a GitHub repo (`git init && git add . && git commit -m "Zannid site" && git push`).
2. vercel.com → Add New → Project → import the repo. Framework is detected as Astro; keep the defaults.
3. Settings → Environment Variables: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Production + Preview).
4. Deploy. Then add your domain under Settings → Domains and update `site` in `astro.config.mjs`.

## Design system
`PRODUCT.md` (product truth), `DESIGN.md` (visual system) and `.impeccable/` are read by the Impeccable skill installed in `.claude/skills/impeccable`. In Claude Code run `/impeccable audit` or `/impeccable polish` before big changes, and `npm run check:design` after a build.
