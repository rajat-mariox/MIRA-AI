import Stripe from 'stripe';
import { env } from '../config/env';

/**
 * Stripe client (wallet recharges). Created lazily on first use so the server boots without keys.
 *
 *   if (!isStripeConfigured()) throw new ApiError(503, 'wallet.paymentsNotConfigured');
 *   const pi = await getStripe().paymentIntents.retrieve(id);
 */

let client: Stripe | null = null;

/** Secret + publishable key present: the app can take card / UPI payments via PaymentSheet. */
export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);
}

/** Webhook signing secret present: POST /payments/stripe/webhook can verify events. */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
}

export function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)');
  if (!client) {
    client = new Stripe(env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: { name: 'mirai-backend' },
    });
  }
  return client;
}

/** API version this SDK is pinned to; ephemeral keys for the mobile PaymentSheet are created with it. */
export const STRIPE_API_VERSION: string = Stripe.API_VERSION;

/** ₹ (whole rupees) -> paise. Stripe amounts are in the currency's smallest unit. */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return Math.round(amount) / 100;
}

export type { Stripe };
