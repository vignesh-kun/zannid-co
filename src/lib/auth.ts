import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env';

const COOKIE = 'zannid_admin';
const TTL_SECONDS = 60 * 60 * 12;

export function passwordConfigured(): boolean {
  return env('ADMIN_PASSWORD').trim().length > 0;
}

/** Constant-time password check. The value only ever comes from the environment. */
export function checkPassword(input: string): boolean {
  const expected = env('ADMIN_PASSWORD');
  if (!expected || !input) return false;
  const provided = createHash('sha256').update(input, 'utf8').digest();
  const actual = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(provided, actual);
}

function secret(): string {
  const explicit = env('ADMIN_SESSION_SECRET');
  if (explicit) return explicit;
  return createHash('sha256').update(`zannid-admin:${env('ADMIN_PASSWORD')}`).digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSession(): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const provided = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof parsed.exp === 'number' && parsed.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function readSession(request: Request): string | undefined {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE) return rest.join('=');
  }
  return undefined;
}

export function isAuthed(request: Request): boolean {
  return verifySession(readSession(request));
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${TTL_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearedCookie(secure: boolean): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export function isSameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

const attempts = new Map<string, { count: number; resetAt: number }>();

/** Small in-memory throttle so the single password cannot be brute forced quickly. */
export function allowAttempt(key: string, limit = 8, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
}
