import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './env';
import { JOURNEY_MEDIA_PREFIX, type JourneyMilestone } from './site';

/**
 * Journey illustration storage.
 *
 * Uploads go to the same place as the rest of the content: Supabase when it is
 * configured, otherwise a local folder next to the content file. Only the
 * reference (`/api/journey/media/…` or the Supabase public URL) is stored in the
 * content records.
 */

export const MEDIA_BUCKET = 'journey';
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const MIN_SIDE = 96;
const MAX_SIDE = 3000;
const LOCAL_DIR = '.data/uploads';
const FILE_PATTERN = /^[a-z0-9]+-[a-f0-9]{12}\.png$/;

export class MediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaError';
  }
}

export type PngInfo = { width: number; height: number; bytes: number };

const hasLatin1 = (bytes: Buffer, offset: number, text: string) =>
  bytes.toString('latin1', offset, offset + text.length) === text;

function client() {
  const config = supabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, { auth: { persistSession: false } });
}

function localDir(): string {
  return resolve(process.cwd(), LOCAL_DIR);
}

export function isManagedMedia(src: string): boolean {
  if (!src) return false;
  if (src.startsWith(JOURNEY_MEDIA_PREFIX)) return true;
  return src.includes(`/storage/v1/object/public/${MEDIA_BUCKET}/`);
}

function managedFileName(src: string): string | null {
  if (src.startsWith(JOURNEY_MEDIA_PREFIX)) {
    const name = src.slice(JOURNEY_MEDIA_PREFIX.length);
    return FILE_PATTERN.test(name) ? name : null;
  }
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  if (src.includes(marker)) {
    const name = src.split(marker)[1]?.split('?')[0] ?? '';
    return FILE_PATTERN.test(name) ? name : null;
  }
  return null;
}

/**
 * Accept only a real PNG that carries an alpha channel **and** at least one
 * pixel that is not fully opaque. Extensions and browser MIME types are
 * ignored: the bytes decide.
 */
export async function inspectPng(bytes: Buffer): Promise<PngInfo> {
  if (bytes.length < 96) throw new MediaError('That file is too small to be a PNG.');
  if (bytes.length > MAX_UPLOAD_BYTES) {
    throw new MediaError(`That image is ${(bytes.length / 1024 / 1024).toFixed(1)} MB. The limit is 6 MB.`);
  }

  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) {
      throw new MediaError('That is not a PNG file. Journey illustrations must be transparent PNGs.');
    }
  }
  if (!hasLatin1(bytes, 12, 'IHDR')) {
    throw new MediaError('That PNG is malformed: no header chunk.');
  }

  const headerWidth = bytes.readUInt32BE(16);
  const headerHeight = bytes.readUInt32BE(20);
  if (headerWidth < MIN_SIDE || headerHeight < MIN_SIDE) {
    throw new MediaError(`That image is ${headerWidth}×${headerHeight}px. Use at least ${MIN_SIDE}px on the short side.`);
  }
  if (headerWidth > MAX_SIDE || headerHeight > MAX_SIDE) {
    throw new MediaError(`That image is ${headerWidth}×${headerHeight}px. The limit is ${MAX_SIDE}px on the long side.`);
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(bytes, { failOn: 'error', limitInputPixels: MAX_SIDE * MAX_SIDE }).metadata();
  } catch {
    throw new MediaError('That PNG could not be decoded. Try exporting it again.');
  }
  if (meta.format !== 'png') {
    throw new MediaError('That is not a PNG file. Journey illustrations must be transparent PNGs.');
  }
  if (meta.width !== headerWidth || meta.height !== headerHeight) {
    throw new MediaError('That PNG declares a different size than it contains.');
  }
  if (!meta.hasAlpha) {
    throw new MediaError('That PNG has no alpha channel, so nothing in it is transparent.');
  }

  // Decode to 8-bit RGBA and look for at least one pixel below full opacity.
  // Palette PNGs with a tRNS entry count too — sharp reports hasAlpha for them.
  let data: Buffer;
  try {
    const eightBit = await sharp(bytes, { failOn: 'error' })
      .png({ compressionLevel: 0 })
      .toBuffer();
    data = await sharp(eightBit).ensureAlpha().raw().toBuffer();
  } catch {
    throw new MediaError('That PNG could not be read to check its transparency.');
  }

  let transparent = false;
  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      transparent = true;
      break;
    }
  }
  if (!transparent) {
    throw new MediaError('That PNG is completely opaque. Journey illustrations need real transparent areas around the cut-out.');
  }

  return { width: headerWidth, height: headerHeight, bytes: bytes.length };
}

let bucketReady: Promise<void> | null = null;

async function ensureBucket(store: NonNullable<ReturnType<typeof client>>): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error } = await store.storage.createBucket(MEDIA_BUCKET, { public: true });
      // "already exists" is the normal case; anything else is reported on upload.
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.warn('journey bucket check:', error.message);
      }
    })();
  }
  await bucketReady;
}

/** Persist validated PNG bytes and return the public reference. */
export async function storePng(bytes: Buffer): Promise<string> {
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString('hex')}.png`;
  const store = client();

  if (store) {
    await ensureBucket(store);
    const { error } = await store.storage
      .from(MEDIA_BUCKET)
      .upload(name, bytes, { contentType: 'image/png', cacheControl: '31536000', upsert: false });
    if (error) {
      throw new MediaError(`Supabase storage rejected the upload: ${error.message}`);
    }
    return store.storage.from(MEDIA_BUCKET).getPublicUrl(name).data.publicUrl;
  }

  try {
    await mkdir(localDir(), { recursive: true });
    await writeFile(resolve(localDir(), name), bytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new MediaError(
      `Could not write the image (${message}). This deployment has a read-only filesystem — add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY so uploads persist.`,
    );
  }
  return `${JOURNEY_MEDIA_PREFIX}${name}`;
}

/** Read a locally stored illustration, for the media route. */
export async function readLocalMedia(name: string): Promise<Buffer | null> {
  if (!FILE_PATTERN.test(name)) return null;
  try {
    return await readFile(resolve(localDir(), name));
  } catch {
    return null;
  }
}

/** Delete one managed illustration. Missing files are not an error. */
export async function removeMedia(src: string): Promise<void> {
  const name = managedFileName(src);
  if (!name) return;

  if (src.startsWith(JOURNEY_MEDIA_PREFIX)) {
    try {
      await unlink(resolve(localDir(), name));
    } catch {
      /* already gone */
    }
    return;
  }

  const store = client();
  if (!store) return;
  const { error } = await store.storage.from(MEDIA_BUCKET).remove([name]);
  if (error) console.warn('journey media cleanup:', error.message);
}

/**
 * Delete uploads that no longer appear anywhere in the content store. Called
 * after a Journey save, with the store read back from storage so a reference
 * added elsewhere always wins.
 */
export async function pruneMedia(
  previous: JourneyMilestone[],
  next: JourneyMilestone[],
  referenceText: string,
): Promise<string[]> {
  const kept = new Set(next.flatMap((milestone) => milestone.illustrations.map((art) => art.src)));
  const removed: string[] = [];

  for (const milestone of previous) {
    for (const art of milestone.illustrations) {
      if (!art.src || kept.has(art.src) || !isManagedMedia(art.src)) continue;
      if (referenceText.includes(art.src)) continue;
      await removeMedia(art.src);
      removed.push(art.src);
    }
  }
  return [...new Set(removed)];
}
