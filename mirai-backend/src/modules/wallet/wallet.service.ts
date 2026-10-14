import { Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { translate, type Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { escapeRegex } from '../../utils/idTransform';
import { parsePagination } from '../../utils/pagination';
import { findUserIdsBySearch, loadUserBriefs, toUserBrief } from '../../utils/userSummary';
import { getActivePlanById } from '../plan/plan.service';
import { User } from '../user/user.model';
import {
  Transaction,
  type PaymentMethod,
  type TransactionDocument,
  type TransactionPurpose,
} from './transaction.model';
import {
  CURRENCY,
  CURRENCY_SYMBOL,
  formatMoney,
  paymentMethodLabel,
  paymentMethodOptions,
  quickRechargeOptions,
  trustBadges,
} from './wallet.config';
import { istDateKey, istDayLabel, istTime, relativeTime } from './wallet.format';
import type { AdminListTransactionsQuery, ListTransactionsQuery, RechargeInput } from './wallet.validation';

// ---------------------------------------------------------------------------
// Core ledger operations (exported for other modules, e.g. chat / kundli)
// ---------------------------------------------------------------------------

export interface DebitWalletInput {
  amount: number;
  purpose: TransactionPurpose;
  title: string;
  description?: string;
  referenceId?: string;
  planId?: string;
}

export interface CreditWalletInput extends DebitWalletInput {
  paymentMethod?: PaymentMethod;
  paymentRef?: string;
  cardLast4?: string;
}

export interface WalletOpResult {
  balance: number;
  transaction: TransactionDocument;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Atomically deducts `amount` from the user's wallet and records a debit transaction.
 * Throws 400 'wallet.insufficientBalance' (never goes negative), 404 'wallet.userNotFound'.
 *
 *   import { debitWallet } from '../wallet/wallet.service';
 *   const { balance, transaction } = await debitWallet(userId, { amount: 199, purpose: 'chat', title: 'Chat with Astrologer', description: 'Pandit Sharma' });
 */
export async function debitWallet(userId: string | Types.ObjectId, input: DebitWalletInput): Promise<WalletOpResult> {
  const amount = roundMoney(input.amount);
  if (!(amount > 0)) throw ApiError.badRequest('wallet.invalidAmount');

  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true, projection: { walletBalance: 1 } },
  ).lean();

  if (!user) {
    const exists = await User.exists({ _id: userId });
    if (!exists) throw ApiError.notFound('wallet.userNotFound');
    throw ApiError.badRequest('wallet.insufficientBalance');
  }

  const balance = roundMoney(user.walletBalance ?? 0);
  try {
    const transaction = await Transaction.create({
      userId,
      type: 'debit',
      amount,
      balanceAfter: balance,
      purpose: input.purpose,
      title: input.title,
      description: input.description ?? '',
      paymentMethod: 'Wallet',
      paymentRef: `WAL-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
      status: 'success',
      currency: CURRENCY,
      referenceId: input.referenceId,
      planId: input.planId,
    });
    return { balance, transaction };
  } catch (err) {
    // Ledger write failed: give the money back so balance and ledger stay consistent.
    await User.updateOne({ _id: userId }, { $inc: { walletBalance: amount } }).catch((e: unknown) =>
      logger.error({ err: e, userId: String(userId), amount }, 'wallet: failed to revert debit'),
    );
    throw err;
  }
}

/**
 * Atomically adds `amount` to the user's wallet and records a credit transaction
 * (recharge / refund / bonus). Throws 404 'wallet.userNotFound'.
 */
export async function creditWallet(userId: string | Types.ObjectId, input: CreditWalletInput): Promise<WalletOpResult> {
  const amount = roundMoney(input.amount);
  if (!(amount > 0)) throw ApiError.badRequest('wallet.invalidAmount');

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { walletBalance: amount } },
    { new: true, projection: { walletBalance: 1 } },
  ).lean();
  if (!user) throw ApiError.notFound('wallet.userNotFound');

  const balance = roundMoney(user.walletBalance ?? 0);
  try {
    const transaction = await Transaction.create({
      userId,
      type: 'credit',
      amount,
      balanceAfter: balance,
      purpose: input.purpose,
      title: input.title,
      description: input.description ?? '',
      paymentMethod: input.paymentMethod ?? 'Wallet',
      paymentRef: input.paymentRef,
      cardLast4: input.cardLast4,
      status: 'success',
      currency: CURRENCY,
      referenceId: input.referenceId,
      planId: input.planId,
    });
    return { balance, transaction };
  } catch (err) {
    await User.updateOne({ _id: userId }, { $inc: { walletBalance: -amount } }).catch((e: unknown) =>
      logger.error({ err: e, userId: String(userId), amount }, 'wallet: failed to revert credit'),
    );
    throw err;
  }
}

/** Current balance (0 for unknown users). */
export async function getBalance(userId: string | Types.ObjectId): Promise<number> {
  const u = await User.findById(userId).select('walletBalance').lean();
  return roundMoney(u?.walletBalance ?? 0);
}

// ---------------------------------------------------------------------------
// App-facing shapes
// ---------------------------------------------------------------------------

type TxLike = {
  _id: unknown;
  type: string;
  amount: number;
  balanceAfter?: number | null;
  purpose: string;
  title: string;
  description?: string | null;
  paymentMethod?: string | null;
  paymentRef?: string | null;
  cardLast4?: string | null;
  status?: string | null;
  planId?: unknown;
  referenceId?: string | null;
  transactionDate?: Date | null;
  createdAt?: Date | null;
};

/** Transaction as rendered by WalletHistoryScreen: title, meta ("10:32 AM • UPI"), amountText ("+₹499"). */
export function toAppTransaction(lang: Lang, t: TxLike) {
  const date = new Date(t.transactionDate ?? t.createdAt ?? Date.now());
  const isCredit = t.type === 'credit';
  const methodLabel = paymentMethodLabel(lang, t.paymentMethod, t.cardLast4);
  const title = t.purpose === 'recharge' ? translate(lang, 'wallet.rechargeTitle') : t.title;
  const description = t.description ?? '';
  const subtitle = isCredit ? methodLabel : description || translate(lang, `wallet.purpose.${t.purpose}`);
  const time = istTime(date);
  const id = String(t._id);
  return {
    _id: id,
    id,
    type: t.type,
    typeLabel: translate(lang, isCredit ? 'wallet.credit' : 'wallet.debit'),
    purpose: t.purpose,
    title,
    description,
    subtitle,
    meta: subtitle ? `${time} • ${subtitle}` : time,
    time,
    amount: t.amount,
    amountText: `${isCredit ? '+' : '-'}${formatMoney(t.amount)}`,
    balanceAfter: t.balanceAfter ?? null,
    paymentMethod: t.paymentMethod ?? null,
    paymentMethodLabel: methodLabel,
    paymentRef: t.paymentRef ?? null,
    status: t.status ?? 'success',
    statusLabel: translate(lang, `wallet.status.${t.status ?? 'success'}`),
    planId: t.planId ? String(t.planId) : null,
    referenceId: t.referenceId ?? null,
    dateKey: istDateKey(date),
    createdAt: date,
  };
}

export async function getDashboard(userId: string, lang: Lang) {
  const [balance, lastRecharge] = await Promise.all([
    getBalance(userId),
    Transaction.findOne({ userId, purpose: 'recharge', status: 'success' })
      .sort({ createdAt: -1 })
      .select('createdAt amount')
      .lean(),
  ]);
  const lastRechargeAt = lastRecharge?.createdAt ?? null;
  const lastRechargeRelative = lastRechargeAt ? relativeTime(lang, new Date(lastRechargeAt)) : null;
  return {
    balance,
    balanceText: formatMoney(balance),
    balanceLabel: translate(lang, 'wallet.availableBalance'),
    currency: CURRENCY,
    currencySymbol: CURRENCY_SYMBOL,
    lastRechargeAt,
    lastRechargeAmount: lastRecharge?.amount ?? null,
    lastRechargeRelative,
    lastRechargeText: lastRechargeRelative
      ? translate(lang, 'wallet.lastRecharged', { time: lastRechargeRelative })
      : translate(lang, 'wallet.neverRecharged'),
    minRechargeAmount: 1,
    maxRechargeAmount: 100_000,
    quickRechargeOptions: quickRechargeOptions(lang),
    paymentMethods: paymentMethodOptions(lang),
    trustBadges: trustBadges(lang),
  };
}

export async function listTransactions(userId: string, lang: Lang, query: ListTransactionsQuery) {
  const p = parsePagination(query, 20);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (query.type === 'recharge' || query.type === 'credit') filter.type = 'credit';
  if (query.type === 'usage' || query.type === 'debit') filter.type = 'debit';

  const [docs, total, balance] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Transaction.countDocuments(filter),
    getBalance(userId),
  ]);

  const now = new Date();
  const groups: Array<{ key: string; label: string; transactions: ReturnType<typeof toAppTransaction>[] }> = [];
  for (const doc of docs) {
    const tx = toAppTransaction(lang, doc as unknown as TxLike);
    let group = groups[groups.length - 1];
    if (!group || group.key !== tx.dateKey) {
      group = { key: tx.dateKey, label: istDayLabel(lang, new Date(tx.createdAt), now), transactions: [] };
      groups.push(group);
    }
    group.transactions.push(tx);
  }

  const totalPages = Math.ceil(total / p.limit);
  return {
    balance,
    balanceText: formatMoney(balance),
    currencySymbol: CURRENCY_SYMBOL,
    type: query.type,
    groups,
    pagination: { page: p.page, limit: p.limit, total, totalPages, hasMore: p.page < totalPages },
  };
}

function simulatedPaymentRef(method: PaymentMethod): string {
  const prefix = method === 'NetBanking' ? 'NB' : method.toUpperCase();
  return `SIM-${prefix}-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** Simulated recharge (no gateway yet): always succeeds. */
export async function recharge(userId: string, lang: Lang, input: RechargeInput) {
  let planId: string | undefined;
  if (input.planId) planId = String((await getActivePlanById(input.planId))._id);
  const method = input.paymentMethod as PaymentMethod;
  const { balance, transaction } = await creditWallet(userId, {
    amount: input.amount,
    purpose: 'recharge',
    title: 'Wallet Recharge',
    description: `Recharge via ${paymentMethodLabel('en', method, input.cardLast4)}`,
    paymentMethod: method,
    paymentRef: simulatedPaymentRef(method),
    cardLast4: method === 'Card' ? input.cardLast4 : undefined,
    planId,
  });
  return { balance, balanceText: formatMoney(balance), transaction: toAppTransaction(lang, transaction.toObject() as TxLike) };
}

export async function debit(userId: string, lang: Lang, input: DebitWalletInput) {
  const { balance, transaction } = await debitWallet(userId, input);
  return { balance, balanceText: formatMoney(balance), transaction: toAppTransaction(lang, transaction.toObject() as TxLike) };
}

// ---------------------------------------------------------------------------
// Admin ("orders")
// ---------------------------------------------------------------------------

function toAdminOrder(t: TxLike & { userId: unknown; updatedAt?: Date | null; currency?: string | null }, user: ReturnType<typeof toUserBrief>) {
  const id = String(t._id);
  return {
    _id: id,
    id,
    userId: { id: user.id, _id: user._id, fullName: user.fullName, email: user.email },
    user: { id: user.id, _id: user._id, name: user.name, email: user.email, phone: user.phone },
    amount: t.amount,
    currency: t.currency ?? CURRENCY,
    type: t.type,
    purpose: t.purpose,
    title: t.title,
    description: t.description ?? '',
    paymentMethod: t.paymentMethod ?? 'Wallet',
    paymentRef: t.paymentRef ?? null,
    cardLast4: t.cardLast4 ?? null,
    status: t.status ?? 'success',
    balanceAfter: t.balanceAfter ?? null,
    planId: t.planId ? String(t.planId) : null,
    referenceId: t.referenceId ?? null,
    transactionDate: t.transactionDate ?? t.createdAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

async function revenueSummary() {
  const [rows, todayRows] = await Promise.all([
    Transaction.aggregate<{ _id: string; amount: number; count: number }>([
      { $match: { status: 'success' } },
      { $group: { _id: { $cond: [{ $eq: ['$purpose', 'recharge'] }, 'recharge', '$type'] }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate<{ _id: null; amount: number; count: number }>([
      {
        $match: {
          status: 'success',
          purpose: 'recharge',
          createdAt: { $gte: new Date(`${istDateKey(new Date())}T00:00:00+05:30`) },
        },
      },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const get = (k: string) => rows.find((r) => r._id === k);
  return {
    totalRevenue: roundMoney(get('recharge')?.amount ?? 0),
    totalRecharges: get('recharge')?.count ?? 0,
    totalSpent: roundMoney(get('debit')?.amount ?? 0),
    totalDebits: get('debit')?.count ?? 0,
    todayRevenue: roundMoney(todayRows[0]?.amount ?? 0),
    todayRecharges: todayRows[0]?.count ?? 0,
    currencySymbol: CURRENCY_SYMBOL,
  };
}

export async function adminListTransactions(query: AdminListTransactionsQuery) {
  const p = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.purpose) filter.purpose = query.purpose;
  if (query.userId) filter.userId = new Types.ObjectId(query.userId);
  if (query.search) {
    const re = { $regex: escapeRegex(query.search), $options: 'i' };
    const userIds = await findUserIdsBySearch(query.search);
    filter.$or = [{ userId: { $in: userIds } }, { title: re }, { description: re }, { paymentRef: re }];
  }

  const [docs, total, summary] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Transaction.countDocuments(filter),
    revenueSummary(),
  ]);
  const users = await loadUserBriefs(docs.map((d) => d.userId));
  const orders = docs.map((d) =>
    toAdminOrder(d as unknown as Parameters<typeof toAdminOrder>[0], users.get(String(d.userId)) ?? toUserBrief(d.userId, null)),
  );
  const totalPages = Math.ceil(total / p.limit);
  return {
    orders,
    total,
    page: p.page,
    limit: p.limit,
    totalPages,
    pagination: { page: p.page, limit: p.limit, total, totalPages },
    summary,
  };
}

export async function adminGetTransaction(id: string) {
  const doc = await Transaction.findById(id).lean();
  if (!doc) throw ApiError.notFound('wallet.transactionNotFound');
  const users = await loadUserBriefs([doc.userId]);
  return toAdminOrder(
    doc as unknown as Parameters<typeof toAdminOrder>[0],
    users.get(String(doc.userId)) ?? toUserBrief(doc.userId, null),
  );
}
