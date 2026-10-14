import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * In-app notification inbox. Every push the backend sends is saved here first (also when FCM is
 * not configured), so GET /notifications works without Firebase.
 *   userId = the recipient, or null for a broadcast to every user.
 *   readBy = ids of the users who have read it (at most one entry for a personal notification).
 */
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 1000 },
    /** e.g. general, horoscope, prediction, event, promo */
    type: { type: String, trim: true, default: 'general', maxlength: 50 },
    /** App route opened on tap (also sent as FCM data.screen) */
    screen: { type: String, trim: true, default: null, maxlength: 50 },
    imageUrl: { type: String, trim: true, default: null },
    /** FCM data payload (string values) */
    data: { type: Schema.Types.Mixed, default: undefined },
    readBy: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true, versionKey: false },
);
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ readBy: 1 });

export type NotificationAttrs = InferSchemaType<typeof notificationSchema>;
export const Notification = model('Notification', notificationSchema);
