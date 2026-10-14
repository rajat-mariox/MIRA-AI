import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';
import { email, idParam } from '../../utils/validators';
import { LEAD_STATUSES } from './lead.model';

/* eslint-disable no-control-regex */
/** Single-line text: no control chars, no HTML tags, collapsed whitespace. */
const line = (v: unknown) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : v;
/** Multi-line text: control chars removed (newlines/tabs kept), normalised line endings. */
const multiline = (v: unknown) =>
  typeof v === 'string'
    ? v
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
    : v;
/* eslint-enable no-control-regex */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optionalLine = (max: number) => z.preprocess((v) => emptyToUndefined(line(v)), z.string().max(max).optional());

const status = z.preprocess((v) => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.enum(LEAD_STATUSES));

/**
 * Public contact form. `website` is a honeypot: a filled one is answered (fake 201) and dropped by
 * `honeypot()` before this schema runs.
 */
export const createLeadSchema = z.object({
  name: z.preprocess(line, z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters')),
  email,
  phone: z.preprocess(
    (v) => emptyToUndefined(line(v)),
    z
      .string()
      .max(20, 'Phone must be at most 20 characters')
      .regex(/^[0-9+()\-.\s]+$/, 'Invalid phone number')
      .optional(),
  ),
  subject: z.preprocess(
    line,
    z.string().min(2, 'Subject must be at least 2 characters').max(150, 'Subject must be at most 150 characters'),
  ),
  message: z.preprocess(
    multiline,
    z.string().min(5, 'Message must be at least 5 characters').max(5000, 'Message must be at most 5000 characters'),
  ),
  source: optionalLine(50),
  page: optionalLine(300),
  referrer: optionalLine(500),
  website: z.string().max(0).optional(),
});

export const adminListLeadsQuery = z.object({
  ...paginationQuery,
  status: z.preprocess(emptyToUndefined, status.optional()),
  search: z.string().trim().max(100).optional(),
});

export const adminUpdateLeadSchema = z
  .object({
    status: status.optional(),
    notes: z.preprocess(multiline, z.string().max(5000).optional()),
  })
  .refine((v) => v.status !== undefined || v.notes !== undefined, { message: 'Provide status or notes' });

export const leadIdParam = idParam();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type AdminListLeadsQuery = z.infer<typeof adminListLeadsQuery>;
export type AdminUpdateLeadInput = z.infer<typeof adminUpdateLeadSchema>;
