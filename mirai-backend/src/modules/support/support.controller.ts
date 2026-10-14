import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as supportService from './support.service';
import type {
  AdminListTicketsQuery,
  AdminUpdateTicketInput,
  CreateTicketInput,
  ListMyTicketsQuery,
} from './support.validation';

// ---------- user (behind requireAuth) ----------

export async function create(req: Request, res: Response) {
  const ticket = await supportService.createTicket(String(req.user!._id), req.lang, req.body as CreateTicketInput);
  return sendSuccess(res, 201, 'support.created', { ticket }, { ticketNumber: ticket.ticketNumber });
}

export async function listMine(req: Request, res: Response) {
  const data = await supportService.listMyTickets(String(req.user!._id), req.lang, req.query as unknown as ListMyTicketsQuery);
  return sendSuccess(res, 200, 'support.listFetched', data);
}

export async function getMine(req: Request, res: Response) {
  const ticket = await supportService.getMyTicket(String(req.user!._id), req.lang, String(req.params.id));
  return sendSuccess(res, 200, 'support.fetched', { ticket });
}

// ---------- admin (behind requireAdmin) ----------

export async function adminList(req: Request, res: Response) {
  const data = await supportService.adminListTickets(req.query as unknown as AdminListTicketsQuery);
  return sendSuccess(res, 200, 'support.listFetched', data);
}

/** The panel reads the ticket directly from `data` (no `{ ticket }` wrapper). */
export async function adminGet(req: Request, res: Response) {
  const ticket = await supportService.adminGetTicket(String(req.params.id));
  return sendSuccess(res, 200, 'support.fetched', ticket);
}

export async function adminUpdate(req: Request, res: Response) {
  const ticket = await supportService.adminUpdateTicket(
    String(req.params.id),
    req.admin?.sub,
    req.body as AdminUpdateTicketInput,
  );
  return sendSuccess(res, 200, 'support.updated', ticket);
}
