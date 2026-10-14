import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJSON } from '../../utils/idTransform';

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** A contact-form submission from the public website (POST /leads). */
const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    /** Where the lead came from ('website' unless the client says otherwise). */
    source: { type: String, trim: true, default: 'website' },
    /** Page path the form was submitted from, e.g. "/contact". */
    page: { type: String, trim: true, default: '' },
    referrer: { type: String, trim: true, default: '' },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    /** Internal admin notes (never shown to the lead). */
    notes: { type: String, trim: true, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
withIdJSON(leadSchema);

export type LeadAttrs = InferSchemaType<typeof leadSchema>;
export const Lead = model('Lead', leadSchema);
export type LeadDocument = InstanceType<typeof Lead>;
