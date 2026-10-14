import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { LOCAL_UPLOAD_DIR, LOCAL_UPLOAD_ROUTE } from '../media/media.storage';
import { Banner, type BannerDocument } from './banner.model';
import type { CreateBannerInput, UpdateBannerInput } from './banner.validation';

const SORT = { order: 1, createdAt: -1 } as const;

/** Active banners for the app, sorted by `order`. */
export async function listActive(): Promise<BannerDocument[]> {
  return Banner.find({ isActive: true }).sort(SORT);
}

/** Every banner for the admin panel, sorted by `order` (the panel does not sort). */
export async function listAll(): Promise<BannerDocument[]> {
  return Banner.find().sort(SORT);
}

export async function getById(id: string): Promise<BannerDocument> {
  const banner = await Banner.findById(id);
  if (!banner) throw ApiError.notFound('banner.notFound');
  return banner;
}

export async function create(input: CreateBannerInput): Promise<BannerDocument> {
  return Banner.create(input);
}

export async function update(id: string, input: UpdateBannerInput): Promise<BannerDocument> {
  const banner = await getById(id);
  for (const [k, v] of Object.entries(input)) if (v !== undefined) banner.set(k, v);
  await banner.save();
  return banner;
}

export async function remove(id: string): Promise<void> {
  const res = await Banner.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw ApiError.notFound('banner.notFound');
}

/** Source copy of the default banner image (committed with the repo). */
const SEED_IMAGE_SRC = path.resolve(process.cwd(), 'assets', 'seed', 'know-your-stars.png');
const SEED_IMAGE_REL = 'banners/know-your-stars.png';

/**
 * Startup seed: when the banners collection is empty, copies the default image into
 * `uploads/banners/` (served at /uploads) and creates the app's "Know Your Stars" banner.
 * The image URL is stored RELATIVE (`/uploads/...`) so it works from any host.
 */
export async function seedBanners(): Promise<void> {
  if ((await Banner.estimatedDocumentCount()) > 0) return;
  const target = path.join(LOCAL_UPLOAD_DIR, ...SEED_IMAGE_REL.split('/'));
  try {
    await fs.access(target);
  } catch {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(SEED_IMAGE_SRC, target);
  }
  await Banner.create({
    title: 'Know Your Stars',
    subtitle: 'Kundli, Panchang & Daily Horoscope',
    buttonText: 'View Today',
    imageUrl: `${LOCAL_UPLOAD_ROUTE}/${SEED_IMAGE_REL}`,
    link: 'Horoscope',
    isActive: true,
    order: 0,
  });
  logger.info('[bootstrap] Seeded default banner "Know Your Stars"');
}
