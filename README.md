# Zannid & Co. website

Multi-page, data-driven site for Zannid & Co. Astro + Three.js on Vercel. Every business fact lives in JSON under `src/data/`; components only render.

## Where to edit

| File | What it controls |
| --- | --- |
| `src/data/site.config.json` | WhatsApp number, email, Instagram, canonical domain, default currency (`INR`), `usdRate` (88), `showUrgencyBanner` |
| `src/data/services.json` | The ten services, copy, deliverables and CTA labels. Order here is the order on the site |
| `src/data/pricing.json` | À la carte rows, the footer note and the “hiring separately” comparison |
| `src/data/bundles.json` | Starter / Growth / Scale amounts, included service slugs and the “Most chosen” flag |
| `src/data/clients.json` | The 25 client-wall entries |
| `src/data/work.json` | Case-study reels, links and public engagement |
| `src/data/faqs.json` | General, pricing and process FAQs |
| `src/data/content.json` | Page copy, stats, process, form budget/region options and legal pages |

### Contact details

Set the real number in `src/data/site.config.json`:

```json
"whatsapp": "919876543210"
```

Digits only, with country code. Leave it empty and WhatsApp buttons point to `/contact` instead of inventing a number. Email and Instagram are read from the same file.

### Pricing rows

```json
{
  "service": "social-media-management",
  "tier": "Growth",
  "unit": "month",
  "inr": { "min": 75000, "max": 125000 },
  "usd": { "min": 850, "max": 1420 },
  "public": true
}
```

- `service` must match a `slug` in `services.json`.
- `unit` is `one-time`, `month` or `shoot day`.
- A retainer (`month`) is prefixed with “from”.
- `max: null` renders **Quote on request**.
- `public: false` keeps a row out of the table without deleting it.
- INR uses Indian grouping; USD uses `$1,500` style. Both values come from this file, so nothing is converted at build time for the table. Bundle USD is derived from `amountInr` and `usdRate`.
- Bundle amounts are in `bundles.json` (Starter ₹49,999; Growth ₹1,29,999; Scale ₹2,49,999+). Only INR is stored; USD is calculated.

### Client logos

`clients.json` uses `"logo": "placeholder"`. The client wall renders a monogram tile from the name. To use real logos later, add the files to `public/assets/` and extend `logo` plus the tile component in `src/pages/work.astro`.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build, includes the Vercel function
```

Node 20+.

## Forms and storage (optional)

`/audit` has a short form; `/contact` is a three-step form. Both POST to `src/pages/api/lead.ts`, which writes to Supabase.

1. Create a Supabase project.
2. SQL Editor → run `supabase/schema.sql`.
3. Project Settings → API → copy the project URL and the `service_role` key.
4. Local: copy `.env.example` to `.env` and fill both values.
5. Vercel: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Production and Preview.

Without the keys, the API returns 503 and the form offers a prefilled WhatsApp or email fallback instead of silently losing the lead.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Vercel → Add New → Project → import the repo. Astro is detected; keep the defaults.
3. Add the two Supabase variables (optional but recommended).
4. Deploy, then add the domain and make sure `canonical` in `site.config.json` matches it. Astro also reads that value as its `site`.

The static pages are prerendered. `/api/lead` is the only serverless function, created by `@astrojs/vercel`.

## Design and behaviour

- **Desktop home:** a WebGL glass nucleus with a scroll-linked ring on the right. Loaded only at ≥1024px, after idle, and reduced to a static frame for `prefers-reduced-motion`.
- **Below 1024px:** no canvas, no pinned sections, normal vertical scroll with fade-in reveals.
- **Glass:** nav, cards, pricing tables, forms and the mobile menu sit on a soft fixed gradient so text keeps AA contrast.
- **Currency:** `/pricing` defaults from the browser locale/time zone (India → INR, elsewhere → USD), remembers the user’s switch in `localStorage`, and updates every price from `data-inr` / `data-usd`.
- **Mobile bar:** “Get a Free Audit” and WhatsApp on every page.
- **Accessibility:** skip link, keyboard focus states, labelled inputs, inline errors, `aria-live` status, reduced-motion support, no horizontal scroll.

## Checks

```bash
npm run build
```

`npm run check:design` still points at the Impeccable audit script; it is optional and not needed to deploy.
