import type { APIRoute } from 'astro';
import { allowAttempt, checkPassword, clientKey, createSession, isSameOrigin, passwordConfigured, sessionCookie } from '../../../lib/auth';
import { json } from '../../../lib/api';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!isSameOrigin(request, url)) return json(403, { ok: false, error: 'Blocked request.' });
  if (!passwordConfigured()) {
    return json(503, {
      ok: false,
      error: 'No admin password is configured. Add ADMIN_PASSWORD to your .env file and restart the server.',
    });
  }
  if (!allowAttempt(clientKey(request))) {
    return json(429, { ok: false, error: 'Too many attempts. Wait ten minutes and try again.' });
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return json(400, { ok: false, error: 'Invalid request.' });
  }

  if (!checkPassword(password)) {
    return json(401, { ok: false, error: 'That password is not right.' });
  }

  return json(200, { ok: true }, { 'set-cookie': sessionCookie(createSession(), url.protocol === 'https:') });
};
