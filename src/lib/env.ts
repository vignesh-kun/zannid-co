import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Server-side environment lookup.
 *
 * On a host (Vercel, Docker, Node) secrets arrive in process.env.
 * During `astro dev` they may only be present in import.meta.env, and as a
 * last resort we read the gitignored .env file directly so the admin
 * password never has to live in source.
 */
const fileCache = new Map<string, string | undefined>();

function fromEnvFile(key: string): string | undefined {
  if (fileCache.has(key)) return fileCache.get(key);
  let value: string | undefined;
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match || match[1] !== key) continue;
      value = match[2].replace(/^['"]|['"]$/g, '').trim() || undefined;
      break;
    }
  } catch {
    value = undefined;
  }
  fileCache.set(key, value);
  return value;
}

export function env(key: string): string {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[key];
  if (fromMeta) return fromMeta;
  return fromEnvFile(key) ?? '';
}

export function supabaseConfig(): { url: string; key: string } | null {
  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return { url, key };
}
