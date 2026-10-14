import { cache } from '../../lib/cache';
import { divineLan, divineRequest, type DivineEndpointName, type DivineFields } from '../../lib/divine';
import type { Lang } from '../../lib/i18n';
import type { UserDocument } from '../user/user.model';
import { ApiError } from '../../utils/ApiError';
import { KundliProfile, type KundliProfileAttrs } from './kundliProfile.model';
import {
  birthParamsHash,
  resolveBirthDetails,
  toDivineBirthFields,
  type BirthOverrides,
  type ProfileSetupRequired,
} from './birthDetails';
import type { ChartId, ChartQuery, DashaQuery, KundliQuery } from './kundli.validation';

/** Kundli results are deterministic per birth data -> cache 30 days. */
const KUNDLI_TTL = 30 * 24 * 3600;

export type KundliResult<T> = { ok: true; data: T } | { ok: false; setup: ProfileSetupRequired };

function splitOverrides<Q extends KundliQuery>(q: Q): BirthOverrides {
  const { full_name, day, month, year, hour, min, sec, gender, place, lat, lon, tzone } = q;
  return { full_name, day, month, year, hour, min, sec, gender, place, lat, lon, tzone };
}

/** A saved kundli profile -> a complete set of birth overrides. */
export function profileToOverrides(
  p: Pick<KundliProfileAttrs, 'name' | 'gender' | 'dateOfBirth' | 'birthTime' | 'birthPlace' | 'lat' | 'lon' | 'tzone'>,
): BirthOverrides {
  const [year, month, day] = p.dateOfBirth.split('-').map(Number);
  const [hour, min] = p.birthTime.split(':').map(Number);
  return {
    full_name: p.name,
    day,
    month,
    year,
    hour,
    min,
    sec: 0,
    gender: p.gender as BirthOverrides['gender'],
    place: p.birthPlace,
    lat: p.lat,
    lon: p.lon,
    tzone: p.tzone ?? 5.5,
  };
}

/** `profileId` -> that saved profile's birth data (own profiles only, 404 otherwise); else the query overrides. */
async function overridesFor(user: UserDocument, q: KundliQuery): Promise<BirthOverrides> {
  if (!q.profileId) return splitOverrides(q);
  const profile = await KundliProfile.findOne({ _id: q.profileId, userId: user._id }).lean();
  if (!profile) throw ApiError.notFound('kundli.savedProfileNotFound');
  return profileToOverrides(profile);
}

/**
 * Resolve birth data, then call Divine (cached by `kundli:<thing>[:extra]:<birthHash>:<lan>`).
 */
async function run<T>(
  user: UserDocument,
  query: KundliQuery,
  lang: Lang,
  opts: {
    endpoint: DivineEndpointName;
    thing: string;
    extraFields?: DivineFields;
    cacheExtra?: string;
    pathSuffix?: string;
    normalize?: (raw: unknown) => T;
  },
): Promise<KundliResult<T>> {
  const resolved = await resolveBirthDetails(user, await overridesFor(user, query));
  if (!resolved.ok) return resolved;

  const lan = divineLan(lang);
  const key = ['kundli', opts.thing, opts.cacheExtra, birthParamsHash(resolved.params), lan].filter(Boolean).join(':');
  const data = await cache.wrap(key, KUNDLI_TTL, async () => {
    const raw = await divineRequest(
      opts.endpoint,
      { ...toDivineBirthFields(resolved.params), ...opts.extraFields },
      lang,
      { pathSuffix: opts.pathSuffix },
    );
    return opts.normalize ? opts.normalize(raw) : (raw as T);
  });
  return { ok: true, data };
}

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});

export const basicDetails = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, { endpoint: 'basicAstroDetails', thing: 'basic', normalize: asObj });

export const planetaryPositions = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, { endpoint: 'planetaryPositions', thing: 'planets', normalize: asObj });

export const kaalSarpa = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, {
    endpoint: 'kaalSarpaYoga',
    thing: 'kaalsarpa',
    extraFields: { node_type: 'meannode' },
    normalize: (raw) => {
      const d = asObj(raw);
      // booleans come as strings ("true"/"false"); add a real boolean, keep vendor fields
      return { ...d, isPresent: String(d.result) === 'true' };
    },
  });

export const manglik = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, {
    endpoint: 'manglikDosha',
    thing: 'manglik',
    normalize: (raw) => {
      const d = asObj(raw);
      return { ...d, isPresent: String(d.manglik_dosha ?? '').toLowerCase() === 'yes' };
    },
  });

export const sadheSati = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, { endpoint: 'sadheSati', thing: 'sadhesati', normalize: asObj });

export const ascendantReport = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, { endpoint: 'ascendantReport', thing: 'ascendant', normalize: asObj });

export const ghataChakra = (u: UserDocument, q: KundliQuery, lang: Lang) =>
  run<Obj>(u, q, lang, { endpoint: 'ghataChakra', thing: 'ghata', normalize: asObj });

export interface ChartData {
  chartId: ChartId;
  chartType: string;
  /** Raw SVG markup. */
  svg: string | null;
  /** `data:image/svg+xml;base64,...` ready for <img src>. */
  base64Image: string | null;
  /** Houses "1".."12": { sign_no, planet: [{ name, symbol, degree, is_retro }] } */
  houses: Obj;
}

export function normalizeChart(raw: unknown, chartId: ChartId, chartType: string): ChartData {
  const d = asObj(raw);
  return {
    chartId,
    chartType,
    svg: typeof d.svg === 'string' ? d.svg : null,
    base64Image: typeof d.base64_image === 'string' ? d.base64_image : null,
    houses: asObj(d.data),
  };
}

export const chart = (u: UserDocument, chartId: ChartId, q: ChartQuery, lang: Lang) =>
  run<ChartData>(u, q, lang, {
    endpoint: 'horoscopeChart',
    thing: 'chart',
    pathSuffix: `/${chartId}`,
    cacheExtra: `${chartId}:${q.chart_type}`,
    // Spec marks the styling fields required -> always send defaults.
    extraFields: {
      chart_type: q.chart_type,
      show_planet_degree: chartId === 'D1' ? 1 : 0,
      show_planet_retro: chartId === 'D1' ? 1 : 0,
      show_modern_planets: 1,
      planet_color: '#333333',
      sign_color: '#333333',
      line_color: '#333333',
      chart_color: '#ffffff',
      node_type: 'meannode',
    },
    normalize: (raw) => normalizeChart(raw, chartId, q.chart_type),
  });

export const vimshottari = (u: UserDocument, q: DashaQuery, lang: Lang) =>
  run<Obj>(u, q, lang, {
    endpoint: 'vimshottariDasha',
    thing: 'dasha',
    cacheExtra: [q.dasha_type, q.maha_dasha, q.antar_dasha].filter(Boolean).join('-'),
    extraFields: { dasha_type: q.dasha_type, maha_dasha: q.maha_dasha, antar_dasha: q.antar_dasha },
    normalize: (raw) => ({ dasha_type: q.dasha_type, ...asObj(raw) }),
  });
