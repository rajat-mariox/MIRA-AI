import {
  initPaymentSheet,
  initStripe,
  PaymentSheetError,
  presentPaymentSheet,
  type PaymentSheet,
} from '@stripe/stripe-react-native';
import { confirmRecharge, createRechargeIntent, type RechargeConfirmation } from '../api/wallet';
import { colors } from '../theme';

/**
 * Wallet recharge with Stripe PaymentSheet (card, UPI, Google Pay... whatever the Stripe
 * account enables). No key is bundled: the publishable key comes with each PaymentIntent
 * from POST /wallet/recharge/intent, and Stripe is initialised with it on first use.
 *
 * The backend credits the wallet (exactly once) from /wallet/recharge/confirm or the Stripe
 * webhook, whichever comes first; the app never adds money itself.
 */

// PaymentSheet colours: hex #RRGGBB or #AARRGGBB only
const NAVY = '#0D1D2B';
const appearance: PaymentSheet.AppearanceParams = {
  colors: {
    primary: colors.primary,
    background: NAVY,
    componentBackground: '#16293A',
    componentBorder: '#33A7D8F2',
    componentDivider: '#33A7D8F2',
    primaryText: '#FFFFFF',
    secondaryText: '#B3FFFFFF',
    componentText: '#FFFFFF',
    placeholderText: '#99FFFFFF',
    icon: '#FFFFFF',
    error: '#FF6B6B',
  },
  shapes: { borderRadius: 12, borderWidth: 1 },
  primaryButton: {
    colors: { background: colors.primary, text: NAVY, border: colors.primary },
    shapes: { borderRadius: 50, height: 48 },
  },
};

let initialisedKey: string | null = null;

async function ensureStripe(publishableKey: string) {
  if (initialisedKey === publishableKey) return;
  // TODO(iOS): pass merchantIdentifier ('merchant.com.miraiastro...') here once Apple Pay is set up
  await initStripe({ publishableKey });
  initialisedKey = publishableKey;
}

export type StripeRechargeResult =
  | { outcome: 'paid'; message: string; confirmation: RechargeConfirmation }
  | { outcome: 'canceled' };

/**
 * Runs the whole recharge: intent -> PaymentSheet -> confirm. Resolves with 'canceled' when the
 * user closes the sheet; throws (Error / ApiError with a user-facing message) on failure.
 */
export async function rechargeWithStripe(
  amount: number,
  billing: { email?: string | null; name?: string | null },
): Promise<StripeRechargeResult> {
  const intent = await createRechargeIntent(amount);
  await ensureStripe(intent.publishableKey);

  const init = await initPaymentSheet({
    merchantDisplayName: intent.merchantDisplayName,
    customerId: intent.customerId,
    customerEphemeralKeySecret: intent.ephemeralKey,
    paymentIntentClientSecret: intent.clientSecret,
    allowsDelayedPaymentMethods: false,
    defaultBillingDetails: {
      ...(billing.email ? { email: billing.email } : {}),
      ...(billing.name ? { name: billing.name } : {}),
    },
    googlePay: {
      merchantCountryCode: intent.merchantCountryCode,
      currencyCode: intent.currency.toUpperCase(),
      testEnv: intent.publishableKey.startsWith('pk_test_'),
    },
    style: 'alwaysDark',
    appearance,
  });
  if (init.error) throw new Error(init.error.localizedMessage || init.error.message);

  const { error } = await presentPaymentSheet();
  if (error) {
    if (error.code === PaymentSheetError.Canceled) return { outcome: 'canceled' };
    throw new Error(error.localizedMessage || error.message);
  }

  const { data, message } = await confirmRecharge(intent.paymentIntentId);
  return { outcome: 'paid', message, confirmation: data };
}
