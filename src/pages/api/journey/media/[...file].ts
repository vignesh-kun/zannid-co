import type { APIRoute } from 'astro';
import { readLocalMedia } from '../../../../lib/media';

export const prerender = false;

/** GET /api/journey/media/<file>.png — local illustration storage. */
export const GET: APIRoute = async ({ params }) => {
  const name = (params.file || '').split('/').pop() || '';
  const bytes = await readLocalMedia(name);
  if (!bytes) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      'content-type': 'image/png',
      'content-length': String(bytes.length),
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
};
