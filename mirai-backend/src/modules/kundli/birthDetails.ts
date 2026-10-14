import { createHash } from 'node:crypto';
import { z } from 'zod';
import { geocodePlace } from '../../lib/geocode';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { User, type UserDocument } from '../user/user.model';

/**
 * Builds Divine birth-data params (§0.7 of the Divine reference) from optional query overrides,
 * falling back to the user's profile. Missing coordinates are geocoded from the place name
 * (Nominatim) and, when the place came from the user's own profile, saved back to the user.
 */

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

/** Optional query overrides accepted by every /kundli endpoint. */
export const birthOverridesShape = {
  full_name: z.string().trim().min(1).max(100).optional(),
  day: int(1, 31).optional(),
  month: int(1, 12).optional(),
  year: int(1800, 2100).optional(),
  hour: int(0, 23).optional(),
  min: int(0, 59).optional(),
  sec: int(0, 59).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  place: z.string().trim().min(2).max(200).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  tzone: z.coerce.number().min(-12).max(14).optional(),
};
export const birthOverridesSchema = z.object(birthOverridesShape);
export type BirthOverrides = z.infer<typeof birthOverridesSchema>;

/** Exact field set sent to Divine kundli endpoints (values are stringified by the client). */
export interface DivineBirthParams {
  full_name: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  sec: number;
  gender: 'male' | 'female';
  place: string;
  lat: number;
  lon: number;
  tzone: number;
}

export interface ProfileSetupRequired {
  isProfileComplete: false;
  profileSetupStep: number;
  missingFields: string[];
}

export type BirthResolution = { ok: true; params: DivineBirthParams } | { ok: false; setup: ProfileSetupRequired };

export async function resolveBirthDetails(user: UserDocument, o: BirthOverrides = {}): Promise<BirthResolution> {
  const missing: string[] = [];

  const fullName = o.full_name ?? user.fullName?.trim();
  if (!fullName) missing.push('fullName');

  // dateOfBirth is stored as midnight UTC -> use UTC parts
  const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
  const validDob = dob && !Number.isNaN(dob.getTime()) ? dob : null;
  const day = o.day ?? validDob?.getUTCDate();
  const month = o.month ?? (validDob ? validDob.getUTCMonth() + 1 : undefined);
  const year = o.year ?? validDob?.getUTCFullYear();
  if (day === undefined || month === undefined || year === undefined) missing.push('dateOfBirth');

  const [bh, bm] = (user.birthTime ?? '').split(':').map((x) => Number(x));
  const profileTime = user.birthTime && Number.isInteger(bh) && Number.isInteger(bm) ? { h: bh!, m: bm! } : null;
  const hour = o.hour ?? profileTime?.h;
  const min = o.min ?? profileTime?.m;
  if (hour === undefined || min === undefined) missing.push('birthTime');

  // Divine only accepts male/female; gender does not change the chart calculations.
  const g = o.gender ?? user.gender;
  if (!g) missing.push('gender');
  const gender: 'male' | 'female' = g === 'female' ? 'female' : 'male';

  const placeFromOverride = o.place !== undefined;
  const place = o.place ?? user.birthPlace?.trim();
  let lat = o.lat ?? (placeFromOverride ? undefined : (user.lat ?? undefined));
  let lon = o.lon ?? (placeFromOverride ? undefined : (user.long ?? undefined));
  if ((lat === undefined || lon === undefined) && !place) missing.push('birthPlace');

  if (missing.length) {
    return {
      ok: false,
      setup: { isProfileComplete: false, profileSetupStep: user.profileSetupStep ?? 0, missingFields: missing },
    };
  }

  if (lat === undefined || lon === undefined) {
    const point = await geocodePlace(place!);
    if (!point) throw new ApiError(422, 'geo.placeNotFound', { params: { place: place! } });
    lat = point.lat;
    lon = point.lon;
    if (!placeFromOverride && o.lat === undefined && o.lon === undefined) {
      // Persist so we geocode each profile only once.
      user.lat = lat;
      user.long = lon;
      User.updateOne({ _id: user._id }, { $set: { lat, long: lon } })
        .exec()
        .catch((err: unknown) => logger.warn({ err }, 'Failed to persist geocoded birth coordinates'));
    }
  }

  return {
    ok: true,
    params: {
      full_name: fullName!,
      day: day!,
      month: month!,
      year: year!,
      hour: hour!,
      min: min!,
      sec: o.sec ?? 0,
      gender,
      place: place ?? `${lat}, ${lon}`,
      lat,
      lon,
      tzone: o.tzone ?? user.tzone ?? 5.5,
    },
  };
}

/** Stable short hash of the birth params, for cache keys (no PII in the key). */
export function birthParamsHash(p: DivineBirthParams): string {
  const canonical = [p.full_name, p.day, p.month, p.year, p.hour, p.min, p.sec, p.gender, p.place, p.lat, p.lon, p.tzone].join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 24);
}

/** Divine wants day/month/hour/min zero-padded strings in its examples; padded values are always accepted. */
export function toDivineBirthFields(p: DivineBirthParams): Record<string, string> {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    full_name: p.full_name,
    day: pad(p.day),
    month: pad(p.month),
    year: String(p.year),
    hour: pad(p.hour),
    min: pad(p.min),
    sec: pad(p.sec),
    gender: p.gender,
    place: p.place,
    lat: String(p.lat),
    lon: String(p.lon),
    tzone: String(p.tzone),
  };
}
