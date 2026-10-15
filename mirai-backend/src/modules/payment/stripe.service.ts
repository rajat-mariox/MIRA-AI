import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { env } from '../../config/env';
import type { Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { getStripe, isStripeConfigured, STRIPE_API_VERSION, toMinorUnits, type Stripe } from '../../lib/stripe';
import { ApiError } from '../../utils/ApiError';
import { User } from '../user/user.model';
import { Transaction, type PaymentMethod, type TransactionDocument } from '../wallet/transaction.model';
import { formatMoney } from '../wallet/wallet.config';
import { creditWallet, getBalance, toAppTransaction } from '../wallet/wallet.service';

/**
 * Stripe wallet recharges.
 *
 *   app  -> POST /wallet/recharge/intent { amount }    createRechargeIntent(): PaymentIntent + ephemeral key
 *   app  -> PaymentSheet (card / UPI / ...)           money moves on Stripe
 *   app  -> POST /wallet/recharge/confirm { id }      confirmRecharge(): credits right away if succeeded
 *   Stripe -> POST /payments/stripe/webhook            handleStripeEvent(): credits if the app never confirmed
 *
 * Both paths go through creditFromPaymentIntent(), which credits a PaymentIntent exactly once
 * (Transaction.paymentRef = pi.id, unique for gateway 'stripe').
 */

export const RECHARGE_PURPOSE = 'wallet_recharge';

function assertConfigured() {
  if (!isStripeConfigured()) throw new ApiError(503, 'wallet.paymentsNotConfigured');
}

/** Logs a Stripe API failure and turns it into a 502 for the app. */
function providerError(err: unknown, context: string): ApiError {
  if (err instanceof ApiError) return err;
  const e = err as { type?: string; code?: string; message?: string; requestId?: string; statusCode?: number };
  logger.error({ type: e.type, code: e.code, message: e.message, requestId: e.requestId, status: e.statusCode }, `stripe: ${context} failed`);
  return new ApiError(502, 'wallet.paymentProviderError');
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

async function createCustomer(userId: string, user: { email: string; fullName?: string | null }): Promise<string> {
  const customer = await getStripe().customers.create(
    {
      email: user.email,
      ...(user.fullName ? { name: user.fullName } : {}),
      metadata: { userId },
    },
    { idempotencyKey: `customer-${userId}-${randomUUID()}` },
  );
  // Keep the first id stored if two requests raced
  const updated = await User.findOneAndUpdate(
    { _id: userId, $or: [{ stripeCustomerId: { $exists: false } }, { stripeCustomerId: null }, { stripeCustomerId: '' }] },
    { $set: { stripeCustomerId: customer.id } },
    { new: true, projection: { stripeCustomerId: 1 } },
  ).lean();
  if (updated?.stripeCustomerId) return updated.stripeCustomerId;
  const current = await User.findById(userId).select('stripeCustomerId').lean();
  return current?.stripeCustomerId || customer.id;
}

/** The user's Stripe Customer id, creating the Customer on the first payment. */
export async function getOrCreateCustomerId(userId: string, opts: { forceNew?: boolean } = {}): Promise<string> {
  const user = await User.findById(userId).select('email fullName stripeCustomerId').lean();
  if (!user) throw ApiError.notFound('wallet.userNotFound');
  if (opts.forceNew) {
    await User.updateOne({ _id: userId }, { $unset: { stripeCustomerId: 1 } });
    return createCustomer(userId, user);
  }
  return user.stripeCustomerId || createCustomer(userId, user);
}

// ---------------------------------------------------------------------------
// PaymentIntent for PaymentSheet
// ---------------------------------------------------------------------------

export interface RechargeIntent {
  paymentIntentId: string;
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  publishableKey: string;
  merchantDisplayName: string;
  merchantCountryCode: string;
  amount: number;
  currency: string;
}

async function createIntentForCustomer(userId: string, customerId: string, amount: number) {
  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: toMinorUnits(amount),
      currency: env.STRIPE_CURRENCY,
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      description: 'MIRAI wallet recharge',
      metadata: { userId, purpose: RECHARGE_PURPOSE, amount: String(amount) },
    },
    { idempotencyKey: `wallet-recharge-${userId}-${randomUUID()}` },
  );
  const ephemeralKey = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: STRIPE_API_VERSION });
  return { paymentIntent, ephemeralKey };
}

/** POST /wallet/recharge/intent */
export async function createRechargeIntent(userId: string, amount: number): Promise<RechargeIntent> {
  assertConfigured();
  try {
    let customerId = await getOrCreateCustomerId(userId);
    let result;
    try {
      result = await createIntentForCustomer(userId, customerId, amount);
    } catch (err) {
      // Stored customer no longer exists (deleted in the dashboard, or test -> live keys): make a new one
      const e = err as { code?: string; param?: string };
      if (e?.code !== 'resource_missing' || (e.param && e.param !== 'customer')) throw err;
      logger.warn({ userId, customerId }, 'stripe: stored customer missing, creating a new one');
      customerId = await getOrCreateCustomerId(userId, { forceNew: true });
      result = await createIntentForCustomer(userId, customerId, amount);
    }
    const { paymentIntent, ephemeralKey } = result;
    if (!paymentIntent.client_secret || !ephemeralKey.secret) throw new Error('Stripe returned no client secret');
    logger.info({ userId, paymentIntentId: paymentIntent.id, amount }, 'stripe: recharge intent created');
    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customerId,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY!,
      merchantDisplayName: env.STRIPE_MERCHANT_NAME,
      merchantCountryCode: env.STRIPE_MERCHANT_COUNTRY,
      amount,
      currency: env.STRIPE_CURRENCY,
    };
  } catch (err) {
    throw providerError(err, 'create recharge intent');
  }
}

// ---------------------------------------------------------------------------
// Crediting (idempotent)
// ---------------------------------------------------------------------------

type ChargeLike = Pick<Stripe.Charge, 'payment_method_details'> | null;

/** Which wallet method a Stripe charge was paid with ("Card" + last4, "UPI", "NetBanking", ...). */
export function paymentMethodFromCharge(charge: ChargeLike): { method: PaymentMethod; cardLast4?: string; label: string } {
  const details = charge?.payment_method_details;
  if (!details) return { method: 'Other', label: 'Stripe' };
  switch (details.type) {
    case 'card': {
      const card = details.card;
      const last4 = card?.last4 ?? undefined;
      const brand = card?.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card';
      return { method: 'Card', cardLast4: last4, label: last4 ? `${brand} ••${last4}` : brand };
    }
    case 'upi':
      return { method: 'UPI', label: 'UPI' };
    case 'netbanking':
      return { method: 'NetBanking', label: 'Net Banking' };
    default:
      return { method: 'Other', label: details.type };
  }
}

async function chargeOf(pi: Stripe.PaymentIntent): Promise<ChargeLike> {
  const lc = pi.latest_charge;
  if (!lc) return null;
  if (typeof lc === 'object') return lc;
  if (!isStripeConfigured()) return null;
  try {
    return await getStripe().charges.retrieve(lc);
  } catch (err) {
    // Only used for the "paid with" label; never block the credit on it
    logger.warn({ err, paymentIntentId: pi.id }, 'stripe: could not load the charge for the payment method');
    return null;
  }
}

export interface CreditResult {
  /** true when this call added the money; false when the PaymentIntent was already credited */
  credited: boolean;
  balance: number;
  transaction: TransactionDocument;
}

function findStripeCredit(paymentIntentId: string) {
  return Transaction.findOne({ gateway: 'stripe', paymentRef: paymentIntentId });
}

/**
 * Credits the wallet for a succeeded recharge PaymentIntent, exactly once per PaymentIntent.
 * Returns null (and credits nothing) when the PaymentIntent is not a succeeded wallet recharge.
 * Safe to call any number of times, concurrently (unique index on paymentRef for gateway 'stripe').
 */
export async function creditFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<CreditResult | null> {
  if (pi.status !== 'succeeded') return null;
  if (pi.metadata?.purpose !== RECHARGE_PURPOSE) return null;
  const userId = pi.metadata?.userId;
  if (!userId || !Types.ObjectId.isValid(userId)) {
    logger.error({ paymentIntentId: pi.id, metadata: pi.metadata }, 'stripe: recharge PaymentIntent without a valid userId');
    return null;
  }
  if (pi.currency?.toLowerCase() !== env.STRIPE_CURRENCY) {
    logger.error({ paymentIntentId: pi.id, currency: pi.currency }, 'stripe: recharge PaymentIntent in an unexpected currency, not credited');
    return null;
  }
  const amount = Math.round(pi.amount_received ?? 0) / 100;
  if (!(amount > 0)) {
    logger.error({ paymentIntentId: pi.id, amountReceived: pi.amount_received }, 'stripe: recharge PaymentIntent with no amount received');
    return null;
  }
  if (pi.metadata.amount && Number(pi.metadata.amount) !== amount) {
    logger.warn({ paymentIntentId: pi.id, expected: pi.metadata.amount, received: amount }, 'stripe: amount received differs from the requested recharge');
  }

  const existing = await findStripeCredit(pi.id);
  if (existing) return { credited: false, balance: await getBalance(userId), transaction: existing };

  const paidWith = paymentMethodFromCharge(await chargeOf(pi));
  try {
    const { balance, transaction } = await creditWallet(userId, {
      amount,
      purpose: 'recharge',
      title: 'Wallet Recharge',
      description: `Recharge via ${paidWith.label}`,
      paymentMethod: paidWith.method,
      paymentRef: pi.id,
      cardLast4: paidWith.method === 'Card' ? paidWith.cardLast4 : undefined,
      gateway: 'stripe',
    });
    logger.info({ userId, paymentIntentId: pi.id, amount, balance }, 'stripe: wallet credited');
    return { credited: true, balance, transaction };
  } catch (err) {
    // Lost a race with the webhook / confirm call: creditWallet already reverted its balance change
    if ((err as { code?: number })?.code === 11000) {
      const tx = await findStripeCredit(pi.id);
      if (tx) return { credited: false, balance: await getBalance(userId), transaction: tx };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// App confirm + webhook
// ---------------------------------------------------------------------------

/** POST /wallet/recharge/confirm: the app calls this after PaymentSheet reports success. */
export async function confirmRecharge(userId: string, lang: Lang, paymentIntentId: string) {
  assertConfigured();
  let pi: Stripe.PaymentIntent;
  try {
    pi = await getStripe().paymentIntents.retrieve(paymentIntentId, { expand: ['latest_charge'] });
  } catch (err) {
    if ((err as { code?: string })?.code === 'resource_missing') throw ApiError.notFound('wallet.paymentNotFound');
    throw providerError(err, 'retrieve payment intent');
  }
  if (pi.metadata?.userId !== userId || pi.metadata?.purpose !== RECHARGE_PURPOSE) {
    throw ApiError.notFound('wallet.paymentNotFound');
  }

  const result = await creditFromPaymentIntent(pi);
  const balance = result?.balance ?? (await getBalance(userId));
  return {
    status: pi.status,
    credited: result?.credited ?? false,
    balance,
    balanceText: formatMoney(balance),
    ...(result
      ? { transaction: toAppTransaction(lang, result.transaction.toObject() as Parameters<typeof toAppTransaction>[1]) }
      : {}),
  };
}

/** Verifies a webhook payload; throws 400 'payments.invalidSignature'. */
export function constructWebhookEvent(rawBody: Buffer | string, signature: string | undefined): Stripe.Event {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) throw new ApiError(503, 'payments.webhookNotConfigured');
  if (!signature || !(Buffer.isBuffer(rawBody) || typeof rawBody === 'string')) {
    throw ApiError.badRequest('payments.invalidSignature');
  }
  try {
    return getStripe().webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ message: (err as Error)?.message }, 'stripe: webhook signature verification failed');
    throw ApiError.badRequest('payments.invalidSignature');
  }
}

/** Handles a verified event. Unknown events are ignored; throws only when a retry could help. */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      if (pi.metadata?.purpose !== RECHARGE_PURPOSE) return;
      try {
        const result = await creditFromPaymentIntent(pi);
        logger.info({ eventId: event.id, paymentIntentId: pi.id, credited: result?.credited ?? false }, 'stripe: payment_intent.succeeded');
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 404) {
          // Account deleted after paying: nothing to credit, don't make Stripe retry forever
          logger.error({ eventId: event.id, paymentIntentId: pi.id, userId: pi.metadata?.userId }, 'stripe: paid recharge for a missing user, not credited');
          return;
        }
        throw err;
      }
      return;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      logger.warn(
        {
          eventId: event.id,
          paymentIntentId: pi.id,
          userId: pi.metadata?.userId,
          code: pi.last_payment_error?.code,
          declineCode: pi.last_payment_error?.decline_code,
          message: pi.last_payment_error?.message,
        },
        'stripe: payment_intent.payment_failed',
      );
      return;
    }
    default:
      logger.debug({ eventId: event.id, type: event.type }, 'stripe: webhook event ignored');
  }
}
