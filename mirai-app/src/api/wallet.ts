import { request, requestWithMessage } from './client';

export type PaymentMethodId = 'upi' | 'card' | 'netbanking';

export type QuickRechargeOption = {
  amount: number;
  label: string;
  isPopular: boolean;
  isDefault: boolean;
  badge?: string;
};

export type PaymentMethodOption = {
  id: PaymentMethodId;
  method: string;
  label: string;
  title: string;
  subtitle: string;
  icon: string;
  isEnabled: boolean;
};

export type WalletDashboard = {
  balance: number;
  balanceText: string;
  balanceLabel: string;
  currency: string;
  currencySymbol: string;
  lastRechargeAt: string | null;
  lastRechargeAmount: number | null;
  lastRechargeRelative: string | null;
  lastRechargeText: string;
  minRechargeAmount: number;
  maxRechargeAmount: number;
  quickRechargeOptions: QuickRechargeOption[];
  paymentMethods: PaymentMethodOption[];
  trustBadges: { id: string; label: string }[];
  /** 'stripe' = pay with Stripe PaymentSheet; 'simulated' = Stripe not set up on the server (dev) */
  payments?: { provider: 'stripe' | 'simulated'; enabled: boolean };
};

export type Transaction = {
  id: string;
  _id: string;
  type: 'credit' | 'debit';
  typeLabel: string;
  purpose: string;
  title: string;
  description: string;
  subtitle: string;
  /** "1:30 PM • UPI" */
  meta: string;
  time: string;
  amount: number;
  /** "+₹399" / "-₹199" */
  amountText: string;
  balanceAfter: number;
  paymentMethod: string | null;
  paymentMethodLabel: string | null;
  status: string;
  statusLabel: string;
  dateKey: string;
  createdAt: string;
};

export type TransactionFilter = 'all' | 'recharge' | 'usage';

export type TransactionGroup = { key: string; label: string; transactions: Transaction[] };

export type TransactionsPage = {
  balance: number;
  balanceText: string;
  currencySymbol: string;
  type: string;
  groups: TransactionGroup[];
  pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
};

/** GET /wallet */
export function getWallet() {
  return request<WalletDashboard>('/wallet');
}

/** GET /wallet/transactions?type&page&limit (IST day groups) */
export function getTransactions(type: TransactionFilter, page = 1, limit = 20) {
  return request<TransactionsPage>('/wallet/transactions', { query: { type, page, limit } });
}

/**
 * POST /wallet/recharge: simulated payment, used only while Stripe isn't configured on the
 * server (`payments.provider === 'simulated'`, local development). Refused in production.
 */
export function recharge(amount: number, paymentMethod: PaymentMethodId, cardLast4?: string) {
  return requestWithMessage<{ balance: number; balanceText: string; transaction: Transaction }>(
    '/wallet/recharge',
    { method: 'POST', body: { amount, paymentMethod, ...(cardLast4 ? { cardLast4 } : {}) } },
  );
}

export type RechargeIntent = {
  paymentIntentId: string;
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
  merchantDisplayName: string;
  merchantCountryCode: string;
  amount: number;
  currency: string;
};

/** POST /wallet/recharge/intent: Stripe PaymentIntent + customer ephemeral key for PaymentSheet */
export function createRechargeIntent(amount: number) {
  return request<RechargeIntent>('/wallet/recharge/intent', { method: 'POST', body: { amount } });
}

export type RechargeConfirmation = {
  /** Stripe PaymentIntent status: 'succeeded' | 'processing' | 'requires_payment_method' | ... */
  status: string;
  credited: boolean;
  balance: number;
  balanceText: string;
  transaction?: Transaction;
};

/** POST /wallet/recharge/confirm: credits the wallet once the PaymentIntent has succeeded */
export function confirmRecharge(paymentIntentId: string) {
  return requestWithMessage<RechargeConfirmation>('/wallet/recharge/confirm', {
    method: 'POST',
    body: { paymentIntentId },
  });
}
