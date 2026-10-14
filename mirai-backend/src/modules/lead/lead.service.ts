import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { isMailerConfigured, sendMail } from '../../lib/mailer';
import { ApiError } from '../../utils/ApiError';
import { escapeRegex } from '../../utils/idTransform';
import { parsePagination } from '../../utils/pagination';
import { LEAD_STATUSES, Lead, type LeadAttrs, type LeadStatus } from './lead.model';
import type { AdminListLeadsQuery, AdminUpdateLeadInput, CreateLeadInput } from './lead.validation';

type LeadLike = LeadAttrs & { _id: unknown; createdAt?: Date; updatedAt?: Date };

export interface LeadMeta {
  ip: string;
  userAgent: string;
  /** Referer header (used when the client does not send `referrer`). */
  referrer?: string;
}

/** Lead as the admin panel sees it (both `_id` and `id`). */
function toAdminLead(l: LeadLike) {
  const id = String(l._id);
  return {
    _id: id,
    id,
    name: l.name,
    email: l.email,
    phone: l.phone ?? '',
    subject: l.subject,
    message: l.message,
    source: l.source ?? 'website',
    page: l.page ?? '',
    referrer: l.referrer ?? '',
    status: l.status ?? 'new',
    notes: l.notes ?? '',
    ip: l.ip ?? '',
    userAgent: l.userAgent ?? '',
    createdAt: l.createdAt ?? null,
    updatedAt: l.updatedAt ?? null,
  };
}

/** Best effort: e-mail the team about a new lead (only with SMTP configured). Never throws. */
function notifyTeam(lead: LeadLike) {
  const to = env.LEADS_NOTIFY_EMAIL ?? env.ADMIN_SEED_EMAIL;
  if (!to || !isMailerConfigured()) return;
  const text = [
    `New website lead (source: ${lead.source || 'website'}${lead.page ? `, page: ${lead.page}` : ''})`,
    '',
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Phone:   ${lead.phone || '-'}`,
    `Subject: ${lead.subject}`,
    '',
    lead.message,
  ].join('\n');
  sendMail({ to, subject: `New lead: ${lead.subject}`, text }).catch((err: unknown) =>
    logger.warn({ err: (err as Error).message }, '[lead] notification email failed'),
  );
}

// ---------- public ----------

export async function createLead(input: CreateLeadInput, meta: LeadMeta) {
  const lead = await Lead.create({
    name: input.name,
    email: input.email,
    phone: input.phone ?? '',
    subject: input.subject,
    message: input.message,
    source: input.source ?? 'website',
    page: input.page ?? '',
    referrer: (input.referrer ?? meta.referrer ?? '').slice(0, 500),
    ip: meta.ip,
    userAgent: meta.userAgent.slice(0, 500),
  });
  notifyTeam(lead.toObject() as LeadLike);
  return { id: String(lead._id) };
}

// ---------- admin ----------

async function statusCounts() {
  const rows = await Lead.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const r of rows) if (r._id in counts) counts[r._id as LeadStatus] = r.count;
  return { ...counts, total: rows.reduce((a, r) => a + r.count, 0) };
}

export async function adminListLeads(query: AdminListLeadsQuery) {
  const p = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.search) {
    const re = { $regex: escapeRegex(query.search), $options: 'i' };
    filter.$or = [{ name: re }, { email: re }, { subject: re }, { phone: re }];
  }
  const [docs, total, stats] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    Lead.countDocuments(filter),
    statusCounts(),
  ]);
  const totalPages = Math.ceil(total / p.limit);
  return {
    leads: docs.map((d) => toAdminLead(d as unknown as LeadLike)),
    total,
    page: p.page,
    limit: p.limit,
    totalPages,
    pagination: { page: p.page, limit: p.limit, total, totalPages },
    stats,
  };
}

export async function adminGetLead(id: string) {
  const doc = await Lead.findById(id).lean();
  if (!doc) throw ApiError.notFound('lead.notFound');
  return toAdminLead(doc as unknown as LeadLike);
}

export async function adminUpdateLead(id: string, input: AdminUpdateLeadInput) {
  const set: Record<string, unknown> = {};
  if (input.status !== undefined) set.status = input.status;
  if (input.notes !== undefined) set.notes = input.notes;
  const doc = await Lead.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
  if (!doc) throw ApiError.notFound('lead.notFound');
  return toAdminLead(doc as unknown as LeadLike);
}

export async function adminDeleteLead(id: string) {
  const doc = await Lead.findByIdAndDelete(id).lean();
  if (!doc) throw ApiError.notFound('lead.notFound');
}
