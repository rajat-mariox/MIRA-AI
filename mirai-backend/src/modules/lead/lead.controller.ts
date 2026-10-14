import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { logger } from '../../lib/logger';
import { sendSuccess } from '../../utils/response';
import * as leadService from './lead.service';
import type { AdminListLeadsQuery, AdminUpdateLeadInput, CreateLeadInput } from './lead.validation';

// ---------- public ----------

/**
 * Honeypot: the website renders a hidden `website` input that humans never fill. A filled one gets
 * the normal 201 answer (with a throwaway id) and nothing is stored. Runs BEFORE validation.
 */
export function honeypot(req: Request, res: Response, next: NextFunction): void {
  const trap = (req.body as Record<string, unknown> | undefined)?.website;
  const filled = typeof trap === 'string' ? trap.trim() !== '' : trap !== undefined && trap !== null;
  if (filled) {
    logger.info({ ip: req.ip }, '[lead] honeypot filled - submission dropped');
    sendSuccess(res, 201, 'lead.created', { lead: { id: String(new Types.ObjectId()) } });
    return;
  }
  next();
}

export async function create(req: Request, res: Response) {
  const lead = await leadService.createLead(req.body as CreateLeadInput, {
    ip: req.ip ?? '',
    userAgent: String(req.get('user-agent') ?? ''),
    referrer: req.get('referer') ?? undefined,
  });
  return sendSuccess(res, 201, 'lead.created', { lead });
}

// ---------- admin (behind requireAdmin) ----------

export async function adminList(req: Request, res: Response) {
  const data = await leadService.adminListLeads(req.query as unknown as AdminListLeadsQuery);
  return sendSuccess(res, 200, 'lead.listFetched', data);
}

export async function adminGet(req: Request, res: Response) {
  const lead = await leadService.adminGetLead(String(req.params.id));
  return sendSuccess(res, 200, 'lead.fetched', { lead });
}

export async function adminUpdate(req: Request, res: Response) {
  const lead = await leadService.adminUpdateLead(String(req.params.id), req.body as AdminUpdateLeadInput);
  return sendSuccess(res, 200, 'lead.updated', { lead });
}

export async function adminDelete(req: Request, res: Response) {
  await leadService.adminDeleteLead(String(req.params.id));
  return sendSuccess(res, 200, 'lead.deleted');
}
