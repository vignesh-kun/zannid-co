import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Static pages + one serverless function (src/pages/api/lead.ts)
export default defineConfig({
  site: 'https://zannid.co', // TODO: your final domain
  output: 'static',
  adapter: vercel(),
});
