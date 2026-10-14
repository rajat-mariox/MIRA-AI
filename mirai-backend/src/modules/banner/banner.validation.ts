import { z } from 'zod';
import { idParam } from '../../utils/validators';

/** Absolute http(s) URL or a server-relative path such as `/uploads/banners/x.png`. */
const imageUrl = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((v) => /^\/(?!\/)\S*$/.test(v) || /^https?:\/\/\S+$/i.test(v), {
    message: 'Must be an absolute http(s) URL or a relative path starting with /',
  });
const subtitle = z.string().trim().max(300);
const buttonText = z.string().trim().max(40);

export const createBannerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  subtitle: subtitle.optional().default(''),
  buttonText: buttonText.optional().transform((v) => v || 'View Today'),
  imageUrl,
  /** Destination when tapped: a URL or an in-app route; empty allowed. */
  link: z.string().trim().max(2000).optional().default(''),
  isActive: z.boolean().optional().default(true),
  order: z.coerce.number().int().min(0).max(100_000).optional().default(0),
});

export const updateBannerSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    subtitle,
    buttonText: buttonText.transform((v) => v || 'View Today'),
    imageUrl,
    link: z.string().trim().max(2000),
    isActive: z.boolean(),
    order: z.coerce.number().int().min(0).max(100_000),
  })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Nothing to update' });

export const bannerIdParam = idParam('id');

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
