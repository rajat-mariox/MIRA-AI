import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

export const TICKET_STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
/** Known categories (app "Issue Type" values, slugified). Other slugs are accepted too. */
export const TICKET_CATEGORIES = ['payment', 'consultation', 'report', 'app_issue', 'billing', 'account', 'other'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

const ticketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Human-friendly id, e.g. "TKT-000123". */
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, trim: true, lowercase: true, default: 'other' },
    /** 'dispute' when raised from the app's "Raise a Dispute" form. */
    source: { type: String, enum: ['ticket', 'dispute'], default: 'ticket' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'medium', index: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'open', index: true },
    adminResponse: { type: String, trim: true, default: '' },
    respondedAt: { type: Date },
    respondedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ userId: 1, createdAt: -1 });
withIdJSON(ticketSchema);

export type TicketAttrs = InferSchemaType<typeof ticketSchema>;
export const SupportTicket = model('SupportTicket', ticketSchema);
export type SupportTicketDocument = InstanceType<typeof SupportTicket>;

/** Sequence for ticket numbers (single doc `{ _id: 'ticket', seq }`). */
const counterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } }, { versionKey: false });
export const SupportCounter = model('SupportCounter', counterSchema);

export async function nextTicketNumber(): Promise<string> {
  const c = await SupportCounter.findOneAndUpdate({ _id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true }).lean();
  return `TKT-${String(c?.seq ?? Date.now()).padStart(6, '0')}`;
}
