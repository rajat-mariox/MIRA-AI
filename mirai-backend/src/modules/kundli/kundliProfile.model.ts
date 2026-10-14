import { Schema, model, type InferSchemaType, type Types } from 'mongoose';

export const KUNDLI_GENDERS = ['male', 'female', 'other'] as const;

/**
 * A saved kundli (birth chart) the user generated — for themselves or someone else.
 * `summary` caches a few basic-details fields (filled from Divine at creation) for list rows.
 */
const kundliProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, enum: KUNDLI_GENDERS, required: true },
    /** "YYYY-MM-DD" */
    dateOfBirth: { type: String, required: true },
    /** "HH:mm" 24h */
    birthTime: { type: String, required: true },
    birthPlace: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    tzone: { type: Number, default: 5.5 },
    isSelf: { type: Boolean, default: false },
    summary: {
      sunSign: { type: String, default: null },
      moonSign: { type: String, default: null },
      ascendant: { type: String, default: null },
      nakshatra: { type: String, default: null },
    },
  },
  { timestamps: true, versionKey: false },
);
kundliProfileSchema.index({ userId: 1, createdAt: -1 });

export type KundliProfileAttrs = InferSchemaType<typeof kundliProfileSchema>;
export const KundliProfile = model('KundliProfile', kundliProfileSchema);

type WithMeta<T> = T & { _id: Types.ObjectId | string; createdAt?: Date; updatedAt?: Date };

export interface PublicKundliProfile {
  id: string;
  _id: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lon: number;
  tzone: number;
  isSelf: boolean;
  summary: { sunSign: string | null; moonSign: string | null; ascendant: string | null; nakshatra: string | null };
  createdAt: Date | null;
  updatedAt: Date | null;
}

export function toPublicKundliProfile(p: WithMeta<KundliProfileAttrs>): PublicKundliProfile {
  const id = String(p._id);
  return {
    id,
    _id: id,
    name: p.name,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth,
    birthTime: p.birthTime,
    birthPlace: p.birthPlace,
    lat: p.lat,
    lon: p.lon,
    tzone: p.tzone ?? 5.5,
    isSelf: !!p.isSelf,
    summary: {
      sunSign: p.summary?.sunSign ?? null,
      moonSign: p.summary?.moonSign ?? null,
      ascendant: p.summary?.ascendant ?? null,
      nakshatra: p.summary?.nakshatra ?? null,
    },
    createdAt: p.createdAt ?? null,
    updatedAt: p.updatedAt ?? null,
  };
}
