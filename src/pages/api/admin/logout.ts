import type { APIRoute } from 'astro';
import { clearedCookie, isSameOrigin } from '../../../lib/auth';
import { json } from '../../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOrigin(request, url)) return json(403, { ok: false, error: 'Blocked request.' });
  return json(200, { ok: true }, { 'set-cookie': clearedCookie(url.protocol === 'https:') });
};
