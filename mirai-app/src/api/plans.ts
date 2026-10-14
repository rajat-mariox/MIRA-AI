import { ApiError, requestWithMessage, request } from './client';
import type { ChatQuota, ChatSubscription } from './chat';

/** An admin-managed plan (GET /plans), drawn as a card on the Plans screen. */
export type Plan = {
  id: string;
  _id: string;
  /** "5 Questions" */
  title: string;
  price: number;
  /** strike-through price; equal to `price` (or missing) when there is no discount */
  originalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  /** "Valid for 48 hrs" */
  validityText?: string;
  /** orange feature line: "Text + Voice" */
  featureHighlight?: string;
  /** "MOST POPULAR": shows the badge chip and a filled Select button */
  badge?: string;
  /** 'chat' | 'call' | ... */
  icon?: string;
  /** "Select" */
  actionText?: string;
  planType?: 'chat_based' | 'question_based' | 'time_based' | 'report_based';
  questionCount?: number;
  validityValue?: number;
  validityUnit?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type PurchaseResult = { subscription: ChatSubscription; balance: number; quota: ChatQuota };

/** GET /plans (active plans by sortOrder) */
export async function getPlans() {
  return (await request<{ plans: Plan[] }>('/plans')).plans;
}

/** POST /plans/:id/purchase: pays from the wallet. 402 = insufficient balance (see insufficientBalance). */
export function purchasePlan(planId: string) {
  return requestWithMessage<PurchaseResult>(`/plans/${planId}/purchase`, { method: 'POST' });
}

/** `{ balance, price }` when a purchase failed for lack of wallet balance, else null. */
export function insufficientBalance(err: unknown): { balance: number; price: number } | null {
  if (!(err instanceof ApiError) || err.statusCode !== 402) return null;
  const data = err.data as { balance?: unknown; price?: unknown } | undefined;
  return {
    balance: typeof data?.balance === 'number' ? data.balance : 0,
    price: typeof data?.price === 'number' ? data.price : 0,
  };
}
