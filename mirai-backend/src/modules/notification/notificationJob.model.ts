import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * One row per scheduled notification sent to a user (src/jobs/notificationJobs.ts). The unique
 * { userId, job, dedupeKey } index makes every job idempotent per user and period (e.g. job
 * 'daily', dedupeKey '2026-10-14'), also across restarts and multiple server instances.
 * Rows expire after 60 days. Deleted with the user (it has `userId`).
 */
const notificationJobLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: String, required: true, trim: true, maxlength: 30 },
    dedupeKey: { type: String, required: true, trim: true, maxlength: 100 },
    notificationId: { type: Schema.Types.ObjectId, ref: 'Notification', default: null },
  },
  { timestamps: true, versionKey: false },
);
notificationJobLogSchema.index({ userId: 1, job: 1, dedupeKey: 1 }, { unique: true });
notificationJobLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

export type NotificationJobLogAttrs = InferSchemaType<typeof notificationJobLogSchema>;
export const NotificationJobLog = model('NotificationJobLog', notificationJobLogSchema);
