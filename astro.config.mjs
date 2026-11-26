import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { readFileSync } from 'node:fs';

const config = JSON.parse(
  readFileSync(new URL('./src/data/site.config.json', import.meta.url), 'utf8'),
);

// Server rendering: every page reads the content store at request time, so
// edits made in /admin appear immediately. Vercel runs the pages as functions.
export default defineConfig({
  site: config.canonical,
  output: 'server',
  adapter: vercel(),
});
