import { translate, type Lang } from '../../lib/i18n';
import type { PaymentMethod } from './transaction.model';

export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const IST_TIMEZONE = 'Asia/Kolkata';

export const MIN_RECHARGE = 1;
export const MAX_RECHARGE = 100_000;

/** Quick-recharge pills on WalletScreen (₹399 is pre-selected in the design). */
export const QUICK_RECHARGE_AMOUNTS = [
  { amount: 99, isPopular: false, isDefault: false },
  { amount: 399, isPopular: true, isDefault: true },
  { amount: 499, isPopular: false, isDefault: false },
  { amount: 999, isPopular: false, isDefault: false },
] as const;

/** Payment method rows on WalletScreen. `id` matches the app's PaymentMethodId; `method` is what we store. */
export const PAYMENT_METHOD_OPTIONS: Array<{ id: 'upi' | 'card' | 'netbanking'; method: PaymentMethod; icon: string }> = [
  { id: 'upi', method: 'UPI', icon: 'moneys' },
  { id: 'card', method: 'Card', icon: 'cards' },
  { id: 'netbanking', method: 'NetBanking', icon: 'card' },
];

/** Accepts app ids ("upi", "card", "netbanking") and display names ("UPI", "Net Banking", "credit card"...). */
export function normalizePaymentMethod(input: unknown): PaymentMethod | undefined {
  if (typeof input !== 'string') return undefined;
  const k = input.trim().toLowerCase().replace(/[\s_\-/]+/g, '');
  if (k === 'upi' || k === 'gpay' || k === 'googlepay' || k === 'phonepe' || k === 'paytm') return 'UPI';
  if (k === 'card' || k === 'creditcard' || k === 'debitcard' || k === 'creditdebitcard') return 'Card';
  if (k === 'netbanking' || k === 'nb' || k === 'bank') return 'NetBanking';
  if (k === 'wallet') return 'Wallet';
  if (k === 'other') return 'Other';
  return undefined;
}

export function quickRechargeOptions(lang: Lang) {
  return QUICK_RECHARGE_AMOUNTS.map((q) => ({
    amount: q.amount,
    label: `${CURRENCY_SYMBOL}${formatAmount(q.amount)}`,
    isPopular: q.isPopular,
    isDefault: q.isDefault,
    ...(q.isPopular ? { badge: translate(lang, 'wallet.popular') } : {}),
  }));
}

export function paymentMethodOptions(lang: Lang) {
  return PAYMENT_METHOD_OPTIONS.map((m) => ({
    id: m.id,
    method: m.method,
    label: translate(lang, `wallet.method.${m.id}.title`),
    title: translate(lang, `wallet.method.${m.id}.title`),
    subtitle: translate(lang, `wallet.method.${m.id}.subtitle`),
    icon: m.icon,
    isEnabled: true,
  }));
}

export function trustBadges(lang: Lang) {
  return [
    { id: 'secure', label: translate(lang, 'wallet.trust.secure') },
    { id: 'instant', label: translate(lang, 'wallet.trust.instant') },
    { id: 'support', label: translate(lang, 'wallet.trust.support') },
  ];
}

/** 1250 -> "1,250" (Indian grouping), keeps up to 2 decimals. */
export function formatAmount(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatMoney(n: number): string {
  return `${CURRENCY_SYMBOL}${formatAmount(n)}`;
}

/** "UPI" | "Card ••4521" | "Net Banking" | "Wallet" */
export function paymentMethodLabel(lang: Lang, method?: string | null, cardLast4?: string | null): string {
  switch (method) {
    case 'UPI':
      return 'UPI';
    case 'Card':
      return cardLast4 ? `${translate(lang, 'wallet.method.cardShort')} ••${cardLast4}` : translate(lang, 'wallet.method.cardShort');
    case 'NetBanking':
      return translate(lang, 'wallet.method.netbanking.title');
    case 'Wallet':
      return translate(lang, 'wallet.method.wallet');
    default:
      return method ?? '';
  }
}
