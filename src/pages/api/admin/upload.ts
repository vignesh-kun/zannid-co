import type { APIRoute } from 'astro';
import { isAuthed, isSameOrigin } from '../../../lib/auth';
import { json } from '../../../lib/api';
import { inspectPng, MAX_UPLOAD_BYTES, MediaError, storePng } from '../../../lib/media';

export const prerender = false;

const TOO_BIG = `That image is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`;

/** POST /api/admin/upload — validated transparent PNG for a Journey chapter. */
export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOrigin(request, url)) return json(403, { ok: false, error: 'Blocked request.' });
  if (!isAuthed(request)) return json(401, { ok: false, error: 'Sign in again.' });

  const type = request.headers.get('content-type') || '';
  if (!type.includes('multipart/form-data')) {
    return json(415, { ok: false, error: 'Send the image as a multipart form upload.' });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, error: 'That upload could not be read.' });
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return json(422, { ok: false, error: 'No image was attached.' });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return json(413, { ok: false, error: TOO_BIG });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const info = await inspectPng(bytes);
    const src = await storePng(bytes);
    return json(200, { ok: true, src, name: file.name, ...info });
  } catch (error) {
    if (error instanceof MediaError) return json(422, { ok: false, error: error.message });
    console.error('journey upload failed', error);
    return json(500, { ok: false, error: 'Could not store that image. Try again.' });
  }
};
