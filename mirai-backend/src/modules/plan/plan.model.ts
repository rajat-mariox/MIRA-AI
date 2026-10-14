import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

export const PLAN_TYPES = ['chat_based', 'question_based', 'time_based', 'report_based'] as const;
export const VALIDITY_UNITS = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'] as const;

const planSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    /** Strike-through price shown next to `price` (defaults to `price`). */
    originalPrice: { type: Number, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true, trim: true },
    currencySymbol: { type: String, default: '₹' },
    validityText: { type: String, trim: true, default: '' },
    featureHighlight: { type: String, trim: true, default: '' },
    badge: { type: String, trim: true, default: '' },
    icon: { type: String, trim: true, default: '' },
    actionText: { type: String, trim: true, default: 'Select' },
    planType: { type: String, enum: PLAN_TYPES, default: 'question_based' },
    questionCount: { type: Number, min: 0, default: 0 },
    validityValue: { type: Number, min: 0, default: 0 },
    validityUnit: { type: String, enum: VALIDITY_UNITS, default: 'days' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

planSchema.index({ isActive: 1, sortOrder: 1 });
withIdJSON(planSchema);

export type PlanAttrs = InferSchemaType<typeof planSchema>;
export const Plan = model('Plan', planSchema);
export type PlanDocument = InstanceType<typeof Plan>;
