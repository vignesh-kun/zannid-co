# Zannid & Co. website

Multi-page, data-driven site for Zannid & Co. Astro + Three.js on Vercel. Every business fact lives in JSON under `src/data/`; components only render.

## Where to edit

| File | What it controls |
| --- | --- |
| `src/data/site.config.json` | WhatsApp number, email, Instagram, canonical domain, `showUrgencyBanner` |
| `src/data/services.json` | The 19 services in order, each with its named options, timelines and inclusions |
| `src/data/service-groups.json` | The five departments used by the services index, rail and footer |
| `src/data/bundles.json` | Starter / Growth / Scale engagement shapes and included service slugs |
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

### Services and options

Every service is rendered as a set of named options rather than a prose description:

```json
{
  "slug": "saas-launchpad-mvp",
  "title": "SaaS Launchpad MVP",
  "shortTitle": "SaaS MVP",
  "group": "product",
  "icon": "rocket",
  "summary": "From idea to a working product in weeks, not quarters.",
  "options": [
    {
      "name": "Validation sprint",
      "bestFor": "Test the demand before building the whole thing.",
      "timeline": "1–2 weeks",
      "includes": ["Problem and user interviews", "Clickable prototype", "Scope and pricing model"]
    }
  ]
}
```

- `group` must match a `slug` in `service-groups.json`.
- `icon` must exist in `src/components/Icon.astro`.
- Order in `services.json` is the order inside each department; department order comes from `service-groups.json`.
- The services index, service page, contact dropdown and footer all read from these files.

### Pricing

There is no rate card and no price data. `/pricing` explains the quote process, the three engagement shapes and what sets the number. Every CTA sends people to `/contact` or `/audit`, where the enquiry is scoped and quoted. To reintroduce published prices later, add a price field to the service options and render it in `src/pages/services/[slug].astro`.

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
- **Services:** a sticky department rail beside an option-led index. Each row shows the service summary and its named options with timelines; each service page turns those options into full cards.
- **Pricing:** quote-led. No figures, currency switch or rate table; the page explains scope, production, build and pace, then routes to a scoping call.
- **Glass:** nav, cards, the service rail, forms and the mobile menu sit on a soft fixed gradient so text keeps AA contrast.
- **Mobile bar:** “Get a Free Audit” and WhatsApp on every page.
- **Accessibility:** skip link, keyboard focus states, labelled inputs, inline errors, `aria-live` status, reduced-motion support, no horizontal scroll.

## Checks

```bash
npm run build
```

`npm run check:design` still points at the Impeccable audit script; it is optional and not needed to deploy.
