# Zannid & Co. website

Multi-page, data-driven site for Zannid & Co. Astro + Three.js on Vercel. Every business fact lives in JSON under `src/data/`; components only render. In production the `/admin` dashboard edits the same content at runtime — the JSON files below are the seed values.

## Where to edit

| File | What it controls |
| --- | --- |
| `src/data/site.config.json` | WhatsApp number, email, Instagram, canonical domain, `showUrgencyBanner` |
| `src/data/services.json` | The 19 services in order, each with its named options, timelines and inclusions |
| `src/data/service-groups.json` | The five departments used by the services index, rail and footer |
| `src/data/bundles.json` | Starter / Growth / Scale engagement shapes and included service slugs |
| `src/data/clients.json` | The 25 client-wall entries |
| `src/data/work.json` | Case-study reels, links and public engagement |
| `src/data/journey.json` | The chapters of `/journey`, each with its date marker, story and cut-out PNGs |
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

## Admin dashboard

The site renders on the server and reads its content at request time, so a save in the dashboard is live immediately — no rebuild, no code edit.

| | |
| --- | --- |
| URL | `/admin` — not linked anywhere on the public site, type it directly |
| Password | `ADMIN_PASSWORD` in `.env` (gitignored). Nothing is hardcoded. |
| Session | Signed, HttpOnly, SameSite=Strict cookie, 12 hours. Changing the password signs everyone out. |
| Sections | Services, Work & case studies, Clients, Journey, About (story, values, team, location), Contact details, FAQ, Privacy & terms |
| Bulk edits | **Import JSON** in every section, with a file picker or paste box and an expected-shape example. Imports are validated before anything is saved. |
| Images | Case studies, clients and team photos are set by URL: a public image URL or a file you add under `public/`. Journey illustrations are uploaded as transparent PNGs. |

### Prices

Each service has a **Prices on site** toggle (the checkbox column in the services list, and a switch inside the service). When it is on, any option with a price shows it on the services index and the service page, and the scope card switches to "Where each option lands". When it is off, every page keeps the quote-only wording. An individual option can hide its own price with **Show this price**.

### Where content is stored

| Environment | Backend | Notes |
| --- | --- | --- |
| Local `npm run dev` | `.data/content.json` | Created on first save, gitignored. Falls back to `src/data/*.json`. |
| Vercel | Supabase `site_content` | The deployed filesystem is read-only, so run `supabase/schema.sql` once, then set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. |

The dashboard header shows which backend is active and warns when it is on the local file. Illustration uploads use the same switch: Supabase Storage on Vercel, `.data/uploads/` locally.

### JSON import shapes

Every section expects the same shape it stores:

- `services` — list of `{ title, shortTitle, group, icon, summary, showPrice, options[] }`, where each option is `{ name, bestFor, timeline, price, showPrice, includes[] }`
- `work` — list of `{ title, client, text, tag, stat, href, image, from, to }`
- `clients` — list of `{ name, description, industry, website, logo }`
- `journey` — list of `{ title, date, subtitle, description, category, published, illustrations[] }`, where each illustration is `{ src, side: "left" | "right", alt, order }`
- `faqs` — list of `{ group, q, a }`
- `about` — one object with `story[]`, `values[]`, `numbers[]`, `team[]` and `location{}`
- `site` — one object of contact, studio and canonical settings
- `legal` — one object with `privacy` and `terms` documents

Slugs are generated from titles on save, and duplicate slugs get a numeric suffix, so importing the same file twice never breaks a page.

## Journey

`/journey` is a scroll-driven picture book, not a timeline: each published chapter becomes one full-screen spread with cut-out illustrations on the left and right and the story in the middle. The chapter count comes from the data, so three chapters means three spreads and twenty means twenty.

- **Navigation:** Journey sits between Clients and Pricing in `navigation` (`src/lib/site.ts`), which feeds the desktop nav, the mobile menu and the footer.
- **Content:** every field is edited in `/admin` → Journey, including publish state and order. Drag a chapter in the list, or use ↑ ↓.
- **Drafts:** an unpublished chapter is invisible to visitors and visible to you while signed in, marked `Draft`, for preview.
- **Empty state:** with no published chapters the page says the first chapter is unwritten rather than inventing one.

### Illustrations

Uploads are validated twice — in the browser and again on the server, which is the authority:

1. PNG signature bytes (not the extension or the browser MIME type).
2. A real decode with sharp, which must report a PNG with an alpha channel.
3. At least one pixel with alpha below 255, so an opaque PNG with an alpha channel is still rejected. Anti-aliased edges and soft shadows pass.
4. 96–3000 px on a side, 6 MB maximum.

JPG, JPEG, WebP, SVG, GIF and renamed files are refused. The preview checkerboard is CSS only; the stored file keeps its own transparency.

Stored files follow the same backend as the content: Supabase Storage (bucket `journey`, public) when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise `.data/uploads/` served by `/api/journey/media/…`. Only the reference is saved in the content record, and replacing or removing an illustration deletes the old file on the next save once nothing else points at it.

The seed illustrations are generated geometry rather than stock images: `node scripts/make-journey-art.mjs` redraws all ten into `public/assets/journey/`. Replace any of them from the dashboard.
