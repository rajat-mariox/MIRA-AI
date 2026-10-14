import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

/** Local upload directory (served statically at /uploads by app.ts when S3 is not configured). */
export const LOCAL_UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
export const LOCAL_UPLOAD_ROUTE = '/uploads';

export interface StoredFile {
  url: string;
  /** Server-relative path (`/uploads/...`) for local storage; equals `url` for S3. Prefer this when storing references. */
  path: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  storage: 's3' | 'local';
}

export const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export function isS3Configured(): boolean {
  return Boolean(env.AWS_S3_BUCKET && env.AWS_REGION);
}

type S3 = import('@aws-sdk/client-s3').S3Client;
let s3: S3 | null = null;

async function getS3(): Promise<{ client: S3; PutObjectCommand: typeof import('@aws-sdk/client-s3').PutObjectCommand }> {
  const mod = await import('@aws-sdk/client-s3');
  if (!s3) {
    s3 = new mod.S3Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
          : undefined, // fall back to the default provider chain (instance role etc.)
    });
  }
  return { client: s3, PutObjectCommand: mod.PutObjectCommand };
}

function publicBaseUrl(): string {
  return env.PUBLIC_BASE_URL.replace(/\/+$/, '');
}

/** Stores one image (S3 when configured, else local disk) and returns its absolute public URL. */
export async function storeImage(
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  folder: string,
): Promise<StoredFile> {
  const ext = IMAGE_EXT[file.mimetype] ?? 'bin';
  const now = new Date();
  const datePath = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const name = `${randomUUID()}.${ext}`;
  const key = `${folder}/${datePath}/${name}`;
  const base = { originalName: file.originalname, mimeType: file.mimetype, size: file.size };

  if (isS3Configured()) {
    const { client, PutObjectCommand } = await getS3();
    await client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    const url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    return { ...base, url, path: url, key, storage: 's3' };
  }

  const target = path.join(LOCAL_UPLOAD_DIR, ...key.split('/'));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  logger.debug({ key }, '[media] Stored file locally');
  const relPath = `${LOCAL_UPLOAD_ROUTE}/${key}`;
  return { ...base, url: `${publicBaseUrl()}${relPath}`, path: relPath, key, storage: 'local' };
}
