import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import * as controller from './support.controller';
import { createTicketSchema, listMyTicketsQuery, ticketIdParam } from './support.validation';

/** Mounted at /support */
const router = Router();

router.use(requireAuth);

router.post('/', validate({ body: createTicketSchema }), asyncHandler(controller.create));
router.get('/', validate({ query: listMyTicketsQuery }), asyncHandler(controller.listMine));
router.get('/:id', validate({ params: ticketIdParam }), asyncHandler(controller.getMine));

export default router;
