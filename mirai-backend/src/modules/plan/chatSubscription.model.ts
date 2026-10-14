import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled'] as const;

/**
 * A plan bought by a user (POST /plans/:id/purchase): a pack of AI chat questions
 * (`questionsTotal`, null = unlimited) usable until `expiresAt` (null = never expires).
 * Questions are reserved atomically by chat (`$inc questionsUsed`) and given back if the AI fails.
 */
const chatSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    /** Plan title at purchase time ("5 Questions") */
    title: { type: String, required: true, trim: true },
    planType: { type: String, default: 'question_based' },
    /** null = unlimited questions */
    questionsTotal: { type: Number, default: null, min: 0 },
    questionsUsed: { type: Number, default: 0, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, required: true },
    /** null = never expires */
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: 'active' },
    /** Wallet debit transaction (null for free plans) */
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', default: null },
  },
  { timestamps: true, versionKey: false },
);

chatSubscriptionSchema.index({ userId: 1, status: 1, createdAt: -1 });
withIdJSON(chatSubscriptionSchema);

export type ChatSubscriptionAttrs = InferSchemaType<typeof chatSubscriptionSchema>;
export const ChatSubscription = model('ChatSubscription', chatSubscriptionSchema);
export type ChatSubscriptionDocument = InstanceType<typeof ChatSubscription>;
