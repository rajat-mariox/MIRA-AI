import { geocodePlace } from '../../lib/geocode';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import type { UserDocument } from '../user/user.model';
import { basicDetails, planetaryPositions, profileToOverrides } from './kundli.service';
import { KundliProfile, toPublicKundliProfile, type PublicKundliProfile } from './kundliProfile.model';
import type { CreateKundliProfileInput, KundliQuery } from './kundli.validation';

type Summary = { sunSign: string | null; moonSign: string | null; ascendant: string | null; nakshatra: string | null };

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/**
 * Sun / moon sign + nakshatra from basic-details, ascendant from planetary-positions
 * (the "Ascendant" row). English names, so the list looks the same in every language.
 */
async function computeSummary(user: UserDocument, query: KundliQuery): Promise<Summary> {
  const [basic, planets] = await Promise.all([
    basicDetails(user, query, 'en'),
    planetaryPositions(user, query, 'en'),
  ]);
  const b = basic.ok ? basic.data : {};
  const list = planets.ok && Array.isArray(planets.data.planets) ? (planets.data.planets as Array<Record<string, unknown>>) : [];
  const asc = list.find((p) => String(p.name).toLowerCase() === 'ascendant');
  return {
    sunSign: str(b.sunsign),
    moonSign: str(b.moonsign),
    ascendant: str(asc?.sign),
    nakshatra: str(b.nakshatra),
  };
}

export async function createProfile(user: UserDocument, input: CreateKundliProfileInput): Promise<PublicKundliProfile> {
  let { lat, lon } = input;
  if (lat === undefined || lon === undefined) {
    const point = await geocodePlace(input.birthPlace);
    if (!point) throw new ApiError(422, 'geo.placeNotFound', { params: { place: input.birthPlace } });
    lat = point.lat;
    lon = point.lon;
  }

  const fields = {
    name: input.name,
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    lat,
    lon,
    tzone: input.tzone,
  };
  // Divine failures propagate (502/503): a kundli we cannot compute is not saved.
  const summary = await computeSummary(user, profileToOverrides(fields) as KundliQuery);

  const doc = await KundliProfile.create({ ...fields, userId: user._id, isSelf: input.isSelf, summary });
  logger.debug({ userId: String(user._id), profileId: String(doc._id) }, 'Kundli profile saved');
  return toPublicKundliProfile(doc.toObject());
}

export async function listProfiles(userId: unknown): Promise<PublicKundliProfile[]> {
  const rows = await KundliProfile.find({ userId }).sort({ createdAt: -1, _id: -1 }).lean();
  return rows.map(toPublicKundliProfile);
}

export async function getProfile(userId: unknown, id: string): Promise<PublicKundliProfile> {
  const row = await KundliProfile.findOne({ _id: id, userId }).lean();
  if (!row) throw ApiError.notFound('kundli.savedProfileNotFound');
  return toPublicKundliProfile(row);
}

export async function deleteProfile(userId: unknown, id: string): Promise<void> {
  const res = await KundliProfile.deleteOne({ _id: id, userId });
  if (!res.deletedCount) throw ApiError.notFound('kundli.savedProfileNotFound');
}
