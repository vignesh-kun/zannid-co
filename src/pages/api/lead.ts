import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = (k: string) => process.env[k] ?? (import.meta.env as Record<string, string | undefined>)[k];
const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try { data = await request.json(); } catch { return json(400, { ok: false, error: 'Invalid request.' }); }

  if (clean(data.website, 200)) return json(200, { ok: true }); // honeypot: silently accept bots

  const name = clean(data.name, 120), brand = clean(data.brand, 160), phone = clean(data.phone, 40);
  const budget = clean(data.budget, 60);
  const needs = Array.isArray(data.needs) ? data.needs.map((n) => clean(n, 40)).filter(Boolean).slice(0, 10) : [];
  if (!name || !brand || phone.replace(/\D/g, '').length < 7)
    return json(422, { ok: false, error: 'Please add your name, brand and a WhatsApp number with country code.' });

  const url = env('SUPABASE_URL'), key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json(503, { ok: false, error: 'Lead storage is not configured yet.' });

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
    name, brand, phone, needs, budget,
    currency: budget.includes('USD') ? 'USD' : 'INR',
    user_agent: clean(request.headers.get('user-agent'), 300),
  });
  if (error) { console.error('lead insert failed', error.message); return json(500, { ok: false, error: 'Could not save right now.' }); }
  return json(200, { ok: true });
};
