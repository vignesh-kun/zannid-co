import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { readFileSync } from 'node:fs';

const config = JSON.parse(
  readFileSync(new URL('./src/data/site.config.json', import.meta.url), 'utf8'),
);

// Static pages plus one serverless function (src/pages/api/lead.ts)
export default defineConfig({
  site: config.canonical,
  output: 'static',
  adapter: vercel(),
});
