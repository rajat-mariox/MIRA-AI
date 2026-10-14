import { Schema, model, type InferSchemaType } from 'mongoose';
import { withIdJson } from '../../utils/mongooseJson';

export const ADMIN_ROLES = ['admin', 'superadmin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Fields never sent to clients. */
const HIDDEN = ['passwordHash', 'resetOtpHash', 'resetOtpExpiresAt', 'resetOtpAttempts', 'passwordChangedAt'];

const adminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ADMIN_ROLES, default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    /** Tokens issued before this instant are rejected (set on password reset). */
    passwordChangedAt: { type: Date },
    /** Password-reset OTP (bcrypt hash), expiry and failed-attempt counter. */
    resetOtpHash: { type: String },
    resetOtpExpiresAt: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false, toJSON: withIdJson(HIDDEN), toObject: withIdJson(HIDDEN) },
);

export type AdminAttrs = InferSchemaType<typeof adminSchema>;
export const Admin = model('Admin', adminSchema);
export type AdminDocument = InstanceType<typeof Admin>;

export interface PublicAdmin {
  id: string;
  _id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Admin object sent to the panel (Navbar reads name/role/email; Settings reads name ?? fullName). */
export function toPublicAdmin(a: AdminDocument): PublicAdmin {
  const id = String(a._id);
  return {
    id,
    _id: id,
    name: a.name,
    fullName: a.name,
    email: a.email,
    role: a.role ?? 'admin',
    isActive: a.isActive !== false,
    lastLoginAt: a.lastLoginAt ?? null,
    createdAt: (a as unknown as { createdAt?: Date }).createdAt ?? null,
    updatedAt: (a as unknown as { updatedAt?: Date }).updatedAt ?? null,
  };
}
