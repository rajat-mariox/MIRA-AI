import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './wallet.controller';
import {
  debitSchema,
  listTransactionsQuery,
  rechargeConfirmSchema,
  rechargeIntentSchema,
  rechargeSchema,
} from './wallet.validation';

/** Mounted at /wallet */
const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(controller.getDashboard));
router.get('/transactions', validate({ query: listTransactionsQuery }), asyncHandler(controller.listTransactions));
router.post('/recharge', validate({ body: rechargeSchema }), asyncHandler(controller.recharge));
// Stripe PaymentSheet: create the PaymentIntent, then confirm (credit) after the sheet succeeds
router.post('/recharge/intent', validate({ body: rechargeIntentSchema }), asyncHandler(controller.rechargeIntent));
router.post('/recharge/confirm', validate({ body: rechargeConfirmSchema }), asyncHandler(controller.rechargeConfirm));
router.post('/debit', validate({ body: debitSchema }), asyncHandler(controller.debit));

export default router;
