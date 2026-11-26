import type { APIRoute } from 'astro';
import { isAuthed, isSameOrigin } from '../../../lib/auth';
import { json } from '../../../lib/api';
import { normalizeCollection, ValidationError } from '../../../lib/admin-schema';
import { isCollectionKey, readStore, StoreError, writeStore } from '../../../lib/store';
import { pruneMedia } from '../../../lib/media';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOrigin(request, url)) return json(403, { ok: false, error: 'Blocked request.' });
  if (!isAuthed(request)) return json(401, { ok: false, error: 'Sign in again.' });

  let body: { collection?: unknown; data?: unknown };
  try {
    body = (await request.json()) as { collection?: unknown; data?: unknown };
  } catch {
    return json(400, { ok: false, error: 'Invalid request.' });
  }

  if (!isCollectionKey(body.collection)) {
    return json(422, { ok: false, error: 'Unknown section.' });
  }

  try {
    const previous = body.collection === 'journey' ? (await readStore()).journey : [];
    const data = normalizeCollection(body.collection, body.data);
    await writeStore(body.collection, data);

    // Replace/remove an illustration and the old file is dropped here — but
    // only once nothing else in the content store points at it.
    if (body.collection === 'journey') {
      const latest = await readStore();
      await pruneMedia(previous, latest.journey, JSON.stringify(latest)).catch((error) => {
        console.warn('journey media prune skipped', error);
      });
    }

    return json(200, { ok: true, data });
  } catch (error) {
    if (error instanceof ValidationError) return json(422, { ok: false, error: error.message });
    if (error instanceof StoreError) return json(503, { ok: false, error: error.message });
    console.error('admin save failed', error);
    return json(500, { ok: false, error: 'Could not save that. Try again.' });
  }
};
