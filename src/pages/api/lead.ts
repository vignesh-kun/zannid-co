import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const env = (key: string) => process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key];
const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const json = (status: number, body: object) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const SOURCES = new Set(['website', 'audit', 'contact']);

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid request.' });
  }

  if (clean(data.website, 200)) return json(200, { ok: true }); // honeypot: quietly accept bots

  const name = clean(data.name, 120);
  const brand = clean(data.brand, 160);
  const phone = clean(data.phone, 40);
  const email = clean(data.email, 200);
  const service = clean(data.service, 80);
  const budget = clean(data.budget, 60);
  const region = clean(data.region, 60);
  const message = clean(data.message, 2000);
  const source = clean(data.source, 30);
  const needs = Array.isArray(data.needs)
    ? data.needs.map((item) => clean(item, 60)).filter(Boolean).slice(0, 12)
    : [];

  if (!name || !brand || phone.replace(/\D/g, '').length < 7) {
    return json(422, { ok: false, error: 'Please add your name, brand and a WhatsApp number with country code.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(422, { ok: false, error: 'Check the email address and try again.' });
  }

  const url = env('SUPABASE_URL');
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    return json(503, {
      ok: false,
      error: 'Lead storage is not configured on this deployment.',
    });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('leads').insert({
    name,
    brand,
    phone,
    email: email || null,
    needs: [...new Set([service, ...needs])].filter(Boolean),
    budget,
    region,
    message,
    currency: budget.includes('USD') ? 'USD' : 'INR',
    source: SOURCES.has(source) ? source : 'website',
    user_agent: clean(request.headers.get('user-agent'), 300),
  });

  if (error) {
    console.error('lead insert failed', error.message);
    return json(500, { ok: false, error: 'Could not save right now.' });
  }
  return json(200, { ok: true });
};
