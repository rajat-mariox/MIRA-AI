import { logger } from '../../lib/logger';
import { seedBanners } from '../banner/banner.service';
import { seedCms } from '../cms/cms.service';
import { seedFaqs } from '../faq/faq.service';
import { registerAdminLoader, seedAdmin } from './admin.service';

/**
 * Called once from server.ts after the DB connects:
 *  - registers the requireAdmin DB check (admin exists + active + token newer than last password reset)
 *  - seeds the first super admin (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD) if no admin exists
 *  - seeds default CMS pages (terms / privacy / about) and FAQs if missing
 *  - seeds the default home banner (and copies its image into uploads/) when there are no banners
 * Seed failures are logged, never fatal.
 */
export async function bootstrapAdmin(): Promise<void> {
  registerAdminLoader();
  for (const [name, fn] of [
    ['admin', seedAdmin],
    ['cms', seedCms],
    ['faq', seedFaqs],
    ['banner', seedBanners],
  ] as const) {
    try {
      await fn();
    } catch (err) {
      logger.error({ err }, `[bootstrap] ${name} seed failed`);
    }
  }
}
