import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './wallet.controller';
import { adminListTransactionsQuery, transactionIdParam } from './wallet.validation';

/** Mounted at /admin/transactions (the panel's "Orders / Revenue" page). */
const router = Router();

router.use(requireAdmin);

router.get('/', validate({ query: adminListTransactionsQuery }), asyncHandler(controller.adminList));
router.get('/:id', validate({ params: transactionIdParam }), asyncHandler(controller.adminGet));

export default router;
