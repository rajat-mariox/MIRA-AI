import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as stripeService from './stripe.service';

/**
 * POST /api/v1/payments/stripe/webhook (raw body, mounted in app.ts before express.json).
 * 400 on a bad signature; 200 for every verified event (unknown ones are ignored);
 * 500 only when crediting failed (Stripe then retries the event).
 */
export async function stripeWebhook(req: Request, res: Response) {
  const event = stripeService.constructWebhookEvent(req.body as Buffer, req.header('stripe-signature'));
  await stripeService.handleStripeEvent(event);
  return sendSuccess(res, 200, 'payments.webhookReceived', { received: true });
}
