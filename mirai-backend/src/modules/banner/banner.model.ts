import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJson } from '../../utils/mongooseJson';

/**
 * Home-screen promotional banners. Managed from the admin panel (/admin/banners),
 * listed to the app via GET /banners (active only, sorted by `order`).
 * Serialised docs carry both `_id` and `id` (the admin panel reads `id`).
 */
const bannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    /** CTA label shown on the banner (app shows "View Today" when empty). */
    buttonText: { type: String, trim: true, default: 'View Today' },
    /** Absolute URL, or a server-relative `/uploads/...` path (resolved against the API host by clients). */
    imageUrl: { type: String, required: true, trim: true },
    link: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, toJSON: withIdJson(), toObject: withIdJson() },
);

bannerSchema.index({ isActive: 1, order: 1 });

export type BannerAttrs = InferSchemaType<typeof bannerSchema>;
export const Banner = model('Banner', bannerSchema);
export type BannerDocument = InstanceType<typeof Banner>;
