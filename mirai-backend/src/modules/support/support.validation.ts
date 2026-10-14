import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { idParam } from '../../utils/validators';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './support.model';

/** "High" -> "high" */
const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v);
/** "In Progress" / "in_progress" / "IN-PROGRESS" -> "in-progress" */
const statusNorm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase().replace(/[\s_]+/g, '-') : v);
/** "App issue" -> "app_issue" */
export const slugify = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'other';

const status = z.preprocess(statusNorm, z.enum(TICKET_STATUSES));
const priority = z.preprocess(lower, z.enum(TICKET_PRIORITIES));

/**
 * Accepts the Postman shape `{ subject, description, category?, priority? }` and the app's
 * "Raise a Dispute" shape `{ issueType, description }` (issueType -> category + subject).
 */
export const createTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().min(5).max(5000),
    category: z.string().trim().min(1).max(50).optional(),
    issueType: z.string().trim().min(1).max(50).optional(),
    priority: priority.optional(),
  })
  .refine((v) => Boolean(v.subject || v.issueType), {
    message: 'subject or issueType is required',
    path: ['subject'],
  });

export const listMyTicketsQuery = z.object({
  ...paginationQuery,
  status: status.optional(),
});

export const adminListTicketsQuery = z.object({
  ...paginationQuery,
  status: z.preprocess((v) => (v === '' ? undefined : v), status.optional()),
  priority: z.preprocess((v) => (v === '' ? undefined : v), priority.optional()),
  category: z.string().trim().max(50).optional(),
  search: z.string().trim().max(100).optional(),
});

export const adminUpdateTicketSchema = z
  .object({
    status: status.optional(),
    priority: priority.optional(),
    adminResponse: z.string().trim().max(5000).optional(),
  })
  .refine((v) => v.status !== undefined || v.priority !== undefined || v.adminResponse !== undefined, {
    message: 'Provide status, priority or adminResponse',
  });

export const ticketIdParam = idParam();

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ListMyTicketsQuery = z.infer<typeof listMyTicketsQuery>;
export type AdminListTicketsQuery = z.infer<typeof adminListTicketsQuery>;
export type AdminUpdateTicketInput = z.infer<typeof adminUpdateTicketSchema>;
