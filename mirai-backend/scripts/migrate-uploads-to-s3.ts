/**
 * Moves locally stored uploads (./uploads) to the S3 bucket and rewrites every database
 * reference to them (`/uploads/...` or `http(s)://host/uploads/...`) to the S3 URL.
 *
 *   npx tsx scripts/migrate-uploads-to-s3.ts --dry-run   # show what would change
 *   npx tsx scripts/migrate-uploads-to-s3.ts             # upload + update the database
 *
 * Needs AWS_REGION, AWS_S3_BUCKET (+ AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY or an instance
 * role) and MONGODB_URI in .env. Safe to run again: files are re-uploaded under the same key
 * and references that already point to S3 are left alone. Local files are kept.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../src/config/env';

const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.svg': 'image/svg+xml',
};

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full)));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Replace references inside any value (strings, arrays, nested objects); returns [newValue, changed] */
function rewrite(value: unknown, rules: { re: RegExp; url: string }[]): [unknown, boolean] {
  if (typeof value === 'string') {
    if (!value.includes('/uploads/')) return [value, false];
    let next = value;
    for (const r of rules) next = next.replace(r.re, r.url);
    return [next, next !== value];
  }
  if (Array.isArray(value)) {
    let changed = false;
    const arr = value.map(v => {
      const [n, c] = rewrite(v, rules);
      changed ||= c;
      return n;
    });
    return [arr, changed];
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId)) {
    let changed = false;
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const [n, c] = rewrite(v, rules);
      changed ||= c;
      obj[k] = n;
    }
    return [obj, changed];
  }
  return [value, false];
}

async function main() {
  if (!env.AWS_S3_BUCKET || !env.AWS_REGION) {
    throw new Error('Set AWS_S3_BUCKET and AWS_REGION in .env first');
  }
  const files = await listFiles(UPLOAD_DIR);
  console.log(`${DRY_RUN ? '[dry run] ' : ''}${files.length} file(s) in ${UPLOAD_DIR}`);

  const s3 = new S3Client({
    region: env.AWS_REGION,
    credentials:
      env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
        : undefined,
  });

  // 1. Upload every file under the same relative key (banners/know-your-stars.png → banners/...)
  const rules: { re: RegExp; url: string }[] = [];
  for (const file of files) {
    const key = path.relative(UPLOAD_DIR, file).split(path.sep).join('/');
    const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    // `/uploads/<key>` with or without a scheme+host in front of it
    rules.push({ re: new RegExp(`(?:https?://[^\\s"'()<>]*?)?/uploads/${escapeRe(key)}`, 'g'), url });
    if (DRY_RUN) {
      console.log(`  would upload ${key} → ${url}`);
      continue;
    }
    const body = await fs.readFile(file);
    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    console.log(`  uploaded ${key}`);
  }

  // 2. Rewrite references in every collection
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db!;
  let updatedDocs = 0;
  for (const { name } of await db.listCollections().toArray()) {
    if (name.startsWith('system.')) continue;
    const col = db.collection(name);
    const cursor = col.find({});
    for await (const doc of cursor) {
      if (!JSON.stringify(doc).includes('/uploads/')) continue;
      const set: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(doc)) {
        if (field === '_id') continue;
        const [next, changed] = rewrite(value, rules);
        if (changed) set[field] = next;
      }
      if (Object.keys(set).length === 0) continue;
      updatedDocs++;
      console.log(`  ${DRY_RUN ? 'would update' : 'updated'} ${name} ${String(doc._id)}: ${Object.keys(set).join(', ')}`);
      if (!DRY_RUN) await col.updateOne({ _id: doc._id }, { $set: set });
    }
  }
  console.log(`${DRY_RUN ? '[dry run] ' : ''}done: ${files.length} file(s), ${updatedDocs} document(s)`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
