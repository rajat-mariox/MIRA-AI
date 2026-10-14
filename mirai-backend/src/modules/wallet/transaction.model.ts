import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

export const TRANSACTION_TYPES = ['credit', 'debit'] as const;
export const TRANSACTION_PURPOSES = [
  'recharge',
  'chat',
  'call',
  'question',
  'kundli',
  'report',
  'plan_purchase',
  'refund',
  'bonus',
  'adjustment',
  'other',
] as const;
export const PAYMENT_METHODS = ['UPI', 'Card', 'NetBanking', 'Wallet', 'Other'] as const;
export const TRANSACTION_STATUSES = ['success', 'pending', 'failed'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionPurpose = (typeof TRANSACTION_PURPOSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

/**
 * Wallet ledger. One document per credit (recharge, refund...) or debit (chat, kundli...).
 * The balance itself lives on `User.walletBalance`; `balanceAfter` snapshots it after this entry.
 * Admin panel calls these "orders" (GET /admin/transactions).
 */
const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, min: 0 },
    purpose: { type: String, enum: TRANSACTION_PURPOSES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'Wallet' },
    /** Gateway / internal reference (e.g. "SIM-UPI-..."); for cards may hold the masked number. */
    paymentRef: { type: String, trim: true },
    /** Last 4 digits for card payments ("Card ••4521"). */
    cardLast4: { type: String, trim: true },
    status: { type: String, enum: TRANSACTION_STATUSES, default: 'success', index: true },
    currency: { type: String, default: 'INR' },
    /** Optional plan bought with this transaction. */
    planId: { type: Schema.Types.ObjectId, ref: 'Plan' },
    /** Free-form link to whatever was paid for (chat session id, report id...). */
    referenceId: { type: String, trim: true },
    transactionDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true, versionKey: false },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
withIdJSON(transactionSchema);

export type TransactionAttrs = InferSchemaType<typeof transactionSchema>;
export const Transaction = model('Transaction', transactionSchema);
export type TransactionDocument = InstanceType<typeof Transaction>;
