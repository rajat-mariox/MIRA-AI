import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { idParam } from '../../utils/validators';
import { TRANSACTION_PURPOSES, TRANSACTION_STATUSES, TRANSACTION_TYPES } from './transaction.model';
import { MAX_RECHARGE, MIN_RECHARGE, normalizePaymentMethod } from './wallet.config';

const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

const paymentMethod = z.preprocess(
  (v) => normalizePaymentMethod(v) ?? v,
  z.enum(['UPI', 'Card', 'NetBanking'], {
    errorMap: () => ({ message: 'paymentMethod must be one of upi, card, netbanking' }),
  }),
);

export const listTransactionsQuery = z.object({
  ...paginationQuery,
  type: z.preprocess(lower, z.enum(['all', 'recharge', 'usage', 'credit', 'debit'])).default('all'),
});

export const rechargeSchema = z.object({
  amount: z.coerce.number().int('Amount must be a whole number').min(MIN_RECHARGE).max(MAX_RECHARGE),
  paymentMethod,
  /** Optional, card payments only: shown as "Card ••4521". */
  cardLast4: z.string().trim().regex(/^\d{4}$/, 'cardLast4 must be 4 digits').optional(),
  planId: z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid id').optional(),
});

export const rechargeIntentSchema = z.object({
  amount: z.coerce.number().int('Amount must be a whole number').min(MIN_RECHARGE).max(MAX_RECHARGE),
});

export const rechargeConfirmSchema = z.object({
  paymentIntentId: z.string().trim().regex(/^pi_[A-Za-z0-9]{8,}$/, 'Invalid paymentIntentId'),
});

export const debitSchema = z.object({
  amount: z.coerce.number().positive().max(MAX_RECHARGE),
  purpose: z.preprocess(lower, z.enum(TRANSACTION_PURPOSES).exclude(['recharge', 'refund', 'bonus'])),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional(),
  referenceId: z.string().trim().max(100).optional(),
});

export const adminListTransactionsQuery = z.object({
  ...paginationQuery,
  search: z.string().trim().max(100).optional(),
  type: z.preprocess(lower, z.enum(TRANSACTION_TYPES)).optional(),
  status: z.preprocess(lower, z.enum(TRANSACTION_STATUSES)).optional(),
  purpose: z.preprocess(lower, z.enum(TRANSACTION_PURPOSES)).optional(),
  userId: z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid id').optional(),
});

export const transactionIdParam = idParam();

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuery>;
export type RechargeInput = z.infer<typeof rechargeSchema>;
export type RechargeIntentInput = z.infer<typeof rechargeIntentSchema>;
export type RechargeConfirmInput = z.infer<typeof rechargeConfirmSchema>;
export type DebitInput = z.infer<typeof debitSchema>;
export type AdminListTransactionsQuery = z.infer<typeof adminListTransactionsQuery>;
