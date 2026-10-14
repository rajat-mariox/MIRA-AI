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
 * POST /wallet/recharge: the backend simulates a successful payment for now.
 * TODO: real payment gateway (Razorpay / PhonePe): create an order on the backend, run the
 * SDK checkout here, and let the backend verify the payment before crediting the wallet.
 */
export function recharge(amount: number, paymentMethod: PaymentMethodId, cardLast4?: string) {
  return requestWithMessage<{ balance: number; balanceText: string; transaction: Transaction }>(
    '/wallet/recharge',
    { method: 'POST', body: { amount, paymentMethod, ...(cardLast4 ? { cardLast4 } : {}) } },
  );
}
