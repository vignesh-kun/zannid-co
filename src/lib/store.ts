import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { env, supabaseConfig } from './env';
import servicesSeed from '../data/services.json';
import workSeed from '../data/work.json';
import clientsSeed from '../data/clients.json';
import faqsSeed from '../data/faqs.json';
import aboutSeed from '../data/about.json';
import journeySeed from '../data/journey.json';
import siteSeed from '../data/site.config.json';
import legalSeed from '../data/legal.json';
import type {
  About,
  Client,
  Faq,
  JourneyMilestone,
  Legal,
  Service,
  SiteConfig,
  WorkItem,
} from './site';

export const COLLECTIONS = [
  'services',
  'work',
  'clients',
  'journey',
  'faqs',
  'about',
  'site',
  'legal',
] as const;
export type CollectionKey = (typeof COLLECTIONS)[number];

export type StoreData = {
  services: Service[];
  work: WorkItem[];
  clients: Client[];
  journey: JourneyMilestone[];
  faqs: Faq[];
  about: About;
  site: SiteConfig;
  legal: Legal;
};

export type StorageInfo = { backend: 'supabase' | 'file'; persistent: boolean; detail: string };

const SEEDS: StoreData = {
  services: servicesSeed as Service[],
  work: workSeed as WorkItem[],
  clients: clientsSeed as Client[],
  journey: journeySeed as JourneyMilestone[],
  faqs: faqsSeed as Faq[],
  about: aboutSeed as About,
  site: siteSeed as SiteConfig,
  legal: legalSeed as Legal,
};

const CACHE_MS = 1500;
let cache: { at: number; data: StoreData } | null = null;

export function isCollectionKey(value: unknown): value is CollectionKey {
  return typeof value === 'string' && (COLLECTIONS as readonly string[]).includes(value);
}

function dataFile(): string {
  return resolve(process.cwd(), env('ZANNID_DATA_FILE') || '.data/content.json');
}

function client() {
  const config = supabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false } });
}

export function storageInfo(): StorageInfo {
  if (supabaseConfig()) {
    return { backend: 'supabase', persistent: true, detail: 'Saved to Supabase (site_content).' };
  }
  return {
    backend: 'file',
    persistent: false,
    detail: 'Saved to .data/content.json on this machine. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist on Vercel.',
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeRows(rows: { key: string; data: unknown }[]): StoreData {
  const data = clone(SEEDS);
  for (const row of rows) {
    if (!isCollectionKey(row.key) || row.data === null || row.data === undefined) continue;
    (data as Record<string, unknown>)[row.key] = row.data;
  }
  return data;
}

async function readLocal(): Promise<StoreData> {
  try {
    const raw = await readFile(dataFile(), 'utf8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return mergeRows(
      Object.entries(parsed).map(([key, value]) => ({ key, data: value })),
    );
  } catch {
    return clone(SEEDS);
  }
}

export async function readStore(): Promise<StoreData> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_MS) return cache.data;

  let data: StoreData;
  const supabase = client();
  if (supabase) {
    const { data: rows, error } = await supabase.from('site_content').select('key, data');
    if (error) {
      console.error('content read failed', error.message);
      data = await readLocal();
    } else {
      data = mergeRows((rows ?? []) as { key: string; data: unknown }[]);
    }
  } else {
    data = await readLocal();
  }

  cache = { at: now, data };
  return data;
}

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StoreError';
  }
}

async function writeLocal(key: CollectionKey, value: unknown) {
  const path = dataFile();
  let all: Record<string, unknown> = {};
  try {
    all = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
  } catch {
    all = {};
  }
  all[key] = value;
  try {
    await mkdir(dirname(path), { recursive: true });
    const temp = `${path}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(all, null, 2)}\n`, 'utf8');
    await rename(temp, path);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new StoreError(
      `Could not write local content (${message}). This deployment has a read-only filesystem — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY so the dashboard can save.`,
    );
  }
}

export async function writeStore(key: CollectionKey, value: unknown): Promise<void> {
  const supabase = client();
  if (supabase) {
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, data: value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw new StoreError(`Supabase rejected the save: ${error.message}`);
  } else {
    await writeLocal(key, value);
  }
  cache = null;
}
