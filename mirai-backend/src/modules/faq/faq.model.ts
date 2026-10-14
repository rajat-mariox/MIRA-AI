import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJson } from '../../utils/mongooseJson';

/** Help & Support FAQs. Serialised docs carry both `_id` (read by the admin panel) and `id`. */
const faqSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, toJSON: withIdJson(), toObject: withIdJson() },
);

faqSchema.index({ isActive: 1, order: 1 });

export type FaqAttrs = InferSchemaType<typeof faqSchema>;
export const Faq = model('Faq', faqSchema);
export type FaqDocument = InstanceType<typeof Faq>;
