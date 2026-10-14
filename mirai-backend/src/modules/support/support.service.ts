import { Types } from 'mongoose';
import { translate, type Lang } from '../../lib/i18n';
import { ApiError } from '../../utils/ApiError';
import { escapeRegex } from '../../utils/idTransform';
import { parsePagination } from '../../utils/pagination';
import { findUserIdsBySearch, loadUserBriefs, toUserBrief, type UserBrief } from '../../utils/userSummary';
import { SupportTicket, TICKET_STATUSES, nextTicketNumber, type TicketAttrs } from './support.model';
import {
  slugify,
  type AdminListTicketsQuery,
  type AdminUpdateTicketInput,
  type CreateTicketInput,
  type ListMyTicketsQuery,
} from './support.validation';

type TicketLike = TicketAttrs & { _id: unknown; createdAt?: Date; updatedAt?: Date };

/** Ticket as the app sees it (own tickets). */
function toUserTicket(lang: Lang, t: TicketLike) {
  const id = String(t._id);
  return {
    _id: id,
    id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category ?? 'other',
    source: t.source ?? 'ticket',
    priority: t.priority ?? 'medium',
    status: t.status ?? 'open',
    statusLabel: translate(lang, `support.status.${t.status ?? 'open'}`),
    adminResponse: t.adminResponse ?? '',
    respondedAt: t.respondedAt ?? null,
    resolvedAt: t.resolvedAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

/** Ticket as the admin panel sees it: `user` is ALWAYS an object (placeholder for deleted users). */
function toAdminTicket(t: TicketLike, user: UserBrief) {
  const id = String(t._id);
  return {
    _id: id,
    id,
    ticketNumber: t.ticketNumber,
    user: { _id: user._id, id: user.id, name: user.name, email: user.email, phone: user.phone },
    userId: user.id,
    subject: t.subject ?? '',
    description: t.description ?? '',
    category: t.category ?? 'other',
    source: t.source ?? 'ticket',
    priority: t.priority ?? 'medium',
    status: t.status ?? 'open',
    adminResponse: t.adminResponse ?? '',
    respondedAt: t.respondedAt ?? null,
    resolvedAt: t.resolvedAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

// ---------- user ----------

export async function createTicket(userId: string, lang: Lang, input: CreateTicketInput) {
  const category = slugify(input.category ?? input.issueType ?? 'other');
  const ticket = await SupportTicket.create({
    userId,
    ticketNumber: await nextTicketNumber(),
    subject: input.subject ?? `Dispute: ${input.issueType}`,
    description: input.description,
    category,
    source: input.issueType ? 'dispute' : 'ticket',
    // Money issues default to high so they surface first in the panel
    priority: input.priority ?? (category === 'payment' || category === 'billing' ? 'high' : 'medium'),
  });
  return toUserTicket(lang, ticket.toObject() as TicketLike);
}

export async function listMyTickets(userId: string, lang: Lang, query: ListMyTicketsQuery) {
  const p = parsePagination(query);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  if (query.status) filter.status = query.status;
  const [docs, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    SupportTicket.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(total / p.limit);
  return {
    tickets: docs.map((d) => toUserTicket(lang, d as unknown as TicketLike)),
    pagination: { page: p.page, limit: p.limit, total, totalPages },
  };
}

export async function getMyTicket(userId: string, lang: Lang, id: string) {
  const doc = await SupportTicket.findOne({ _id: id, userId }).lean();
  if (!doc) throw ApiError.notFound('support.notFound');
  return toUserTicket(lang, doc as unknown as TicketLike);
}

// ---------- admin ----------

async function statusCounts() {
  const rows = await SupportTicket.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts: Record<string, number> = Object.fromEntries(TICKET_STATUSES.map((s) => [s, 0]));
  for (const r of rows) counts[r._id] = r.count;
  return { ...counts, total: rows.reduce((a, r) => a + r.count, 0) };
}

export async function adminListTickets(query: AdminListTicketsQuery) {
  const p = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = slugify(query.category);
  if (query.search) {
    const re = { $regex: escapeRegex(query.search), $options: 'i' };
    const userIds = await findUserIdsBySearch(query.search);
    filter.$or = [{ userId: { $in: userIds } }, { subject: re }, { description: re }, { ticketNumber: re }];
  }
  const [docs, total, stats] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
    SupportTicket.countDocuments(filter),
    statusCounts(),
  ]);
  const users = await loadUserBriefs(docs.map((d) => d.userId));
  const totalPages = Math.ceil(total / p.limit);
  return {
    tickets: docs.map((d) =>
      toAdminTicket(d as unknown as TicketLike, users.get(String(d.userId)) ?? toUserBrief(d.userId, null)),
    ),
    total,
    page: p.page,
    limit: p.limit,
    totalPages,
    pagination: { page: p.page, limit: p.limit, total, totalPages },
    stats,
  };
}

export async function adminGetTicket(id: string) {
  const doc = await SupportTicket.findById(id).lean();
  if (!doc) throw ApiError.notFound('support.notFound');
  const users = await loadUserBriefs([doc.userId]);
  return toAdminTicket(doc as unknown as TicketLike, users.get(String(doc.userId)) ?? toUserBrief(doc.userId, null));
}

export async function adminUpdateTicket(id: string, adminId: string | undefined, input: AdminUpdateTicketInput) {
  const set: Record<string, unknown> = {};
  if (input.status !== undefined) {
    set.status = input.status;
    if (input.status === 'resolved' || input.status === 'closed') set.resolvedAt = new Date();
  }
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.adminResponse !== undefined) {
    set.adminResponse = input.adminResponse;
    if (input.adminResponse) {
      set.respondedAt = new Date();
      if (adminId) set.respondedBy = adminId;
    }
  }
  const doc = await SupportTicket.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
  if (!doc) throw ApiError.notFound('support.notFound');
  const users = await loadUserBriefs([doc.userId]);
  return toAdminTicket(doc as unknown as TicketLike, users.get(String(doc.userId)) ?? toUserBrief(doc.userId, null));
}
