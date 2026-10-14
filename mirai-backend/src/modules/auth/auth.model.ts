import { Schema, model, type InferSchemaType } from 'mongoose';

export const DEVICE_TYPES = ['ios', 'android', 'web'] as const;

/* ------------------------------------------------------------------ */
/* OTP: one pending code per email. Auto-deleted by TTL at expiresAt.  */
/* ------------------------------------------------------------------ */
const otpSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type OtpAttrs = InferSchemaType<typeof otpSchema>;
export const Otp = model('Otp', otpSchema);

/* ------------------------------------------------------------------ */
/* Session: one per (user, device). Holds the hash of the CURRENT      */
/* refresh token; access tokens carry its _id as `sid`, so deleting a  */
/* session revokes both tokens immediately. TTL-deleted at expiresAt.  */
/* ------------------------------------------------------------------ */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true, trim: true },
    deviceType: { type: String, enum: DEVICE_TYPES, required: true },
    deviceName: { type: String, trim: true },
    /** Firebase Cloud Messaging token for push notifications (used by the notifications module). */
    fcmToken: { type: String, index: true, sparse: true },
    refreshTokenHash: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false },
);
sessionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionAttrs = InferSchemaType<typeof sessionSchema>;
export const Session = model('Session', sessionSchema);
export type SessionDocument = InstanceType<typeof Session>;
