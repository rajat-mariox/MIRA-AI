import { Router } from 'express';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './support.controller';
import { adminListTicketsQuery, adminUpdateTicketSchema, ticketIdParam } from './support.validation';

/** Mounted at /admin/support */
const router = Router();

router.use(requireAdmin);

router.get('/', validate({ query: adminListTicketsQuery }), asyncHandler(controller.adminList));
router.get('/:id', validate({ params: ticketIdParam }), asyncHandler(controller.adminGet));
router.put('/:id', validate({ params: ticketIdParam, body: adminUpdateTicketSchema }), asyncHandler(controller.adminUpdate));
// PATCH alias with the same semantics
router.patch('/:id', validate({ params: ticketIdParam, body: adminUpdateTicketSchema }), asyncHandler(controller.adminUpdate));

export default router;
