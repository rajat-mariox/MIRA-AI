import { z } from 'zod';
import { idParam } from '../../utils/validators';
import { CMS_TYPES } from './cms.model';

const cmsType = z.preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(CMS_TYPES));

export const publicCmsQuery = z.object({ type: cmsType });

/** POST /admin/cms: upsert by `type`. */
export const upsertCmsSchema = z.object({
  type: cmsType,
  title: z.string().trim().max(200).optional(),
  content: z.string().min(1).max(500_000),
  isActive: z.boolean().optional(),
});

/** PUT /admin/cms/:id (the panel sends only `{ content }`). */
export const updateCmsSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    content: z.string().min(1).max(500_000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Nothing to update' });

export const cmsIdParam = idParam('id');

export type UpsertCmsInput = z.infer<typeof upsertCmsSchema>;
export type UpdateCmsInput = z.infer<typeof updateCmsSchema>;
