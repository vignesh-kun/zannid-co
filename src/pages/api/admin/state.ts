import type { APIRoute } from 'astro';
import { isAuthed, passwordConfigured } from '../../../lib/auth';
import { json } from '../../../lib/api';
import { readStore, storageInfo } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authed = isAuthed(request);
  if (!authed) {
    return json(200, {
      authed: false,
      ready: passwordConfigured(),
      error: passwordConfigured()
        ? null
        : 'No admin password is configured. Add ADMIN_PASSWORD to .env and restart.',
    });
  }

  const data = await readStore();
  return json(200, {
    authed: true,
    ready: true,
    storage: storageInfo(),
    data,
  });
};
