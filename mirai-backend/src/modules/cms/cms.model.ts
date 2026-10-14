import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJson } from '../../utils/mongooseJson';

export const CMS_TYPES = ['terms', 'privacy', 'about'] as const;
export type CmsType = (typeof CMS_TYPES)[number];

/** One static page per `type` (Terms, Privacy Policy, About). `content` is HTML. */
const cmsSchema = new Schema(
  {
    type: { type: String, enum: CMS_TYPES, required: true, unique: true },
    title: { type: String, trim: true, default: '' },
    content: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false, toJSON: withIdJson(), toObject: withIdJson() },
);

export type CmsAttrs = InferSchemaType<typeof cmsSchema>;
export const Cms = model('Cms', cmsSchema, 'cms');
export type CmsDocument = InstanceType<typeof Cms>;
