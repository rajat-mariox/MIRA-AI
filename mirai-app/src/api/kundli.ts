import { request } from './client';

/** Optional birth-data overrides (default = the user's profile). */
export type KundliOverrides = Partial<{
  full_name: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  gender: 'male' | 'female' | 'other';
  place: string;
  /** a saved kundli profile; its birth data replaces the user's own */
  profileId: string;
}>;

/** Returned (200) when the profile lacks birth data. */
export type KundliProfileIncomplete = {
  isProfileComplete: false;
  profileSetupStep: number;
  missingFields: string[];
};

export type KundliResult<T> = ({ isProfileComplete: true } & T) | KundliProfileIncomplete;

export function isKundliIncomplete<T>(r: KundliResult<T> | null | undefined): r is KundliProfileIncomplete {
  return !!r && r.isProfileComplete === false;
}

/** Divine payloads are passed through with vendor field names. */
export type KundliObject = Record<string, unknown>;

export type ChartPlanet = {
  name: string;
  symbol?: string;
  degree?: number | string;
  is_retro?: boolean | string;
};
export type ChartHouse = { sign_no: number; planet?: ChartPlanet[] };

export type ChartData = {
  chartId: string;
  chartType: string;
  svg: string | null;
  base64Image: string | null;
  /** houses "1".."12" */
  houses: Record<string, ChartHouse>;
};

export type ChartId =
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'D7'
  | 'D9'
  | 'D10'
  | 'D12'
  | 'D16'
  | 'D20'
  | 'D24'
  | 'D30'
  | 'D60'
  | 'MOON'
  | 'SUN'
  | 'chalit';

type Q = Record<string, string | number | undefined>;
const get = <T>(path: string, query?: Q) => request<KundliResult<T>>(`/kundli${path}`, { query });

export const getBasicDetails = (o?: KundliOverrides) => get<KundliObject>('/basic-details', o);
export const getPlanetaryPositions = (o?: KundliOverrides) =>
  get<KundliObject>('/planetary-positions', o);
export const getChart = (chartId: ChartId, o?: KundliOverrides) =>
  get<ChartData>(`/charts/${chartId}`, { chart_type: 'north', ...o });
export const getManglik = (o?: KundliOverrides) => get<KundliObject>('/doshas/manglik', o);
export const getKaalSarpa = (o?: KundliOverrides) => get<KundliObject>('/doshas/kaal-sarpa', o);
export const getSadheSati = (o?: KundliOverrides) => get<KundliObject>('/doshas/sadhe-sati', o);
export type DashaType = 'maha-dasha' | 'antar-dasha' | 'pratyantar-dasha';
export const getVimshottari = (o?: KundliOverrides, dashaType: DashaType = 'maha-dasha') =>
  get<KundliObject>('/dasha/vimshottari', { dasha_type: dashaType, ...o });
export const getAscendantReport = (o?: KundliOverrides) => get<KundliObject>('/reports/ascendant', o);

// ---- Saved kundli profiles ----

export type KundliGender = 'male' | 'female' | 'other';

export type KundliProfile = {
  id: string;
  _id: string;
  name: string;
  gender: KundliGender;
  /** "YYYY-MM-DD" */
  dateOfBirth: string;
  /** "HH:mm" (24h) */
  birthTime: string;
  birthPlace: string;
  lat: number;
  lon: number;
  tzone: number;
  isSelf: boolean;
  summary: { sunSign: string | null; moonSign: string | null; ascendant: string | null; nakshatra: string | null };
  createdAt: string | null;
  updatedAt: string | null;
};

export type CreateKundliProfileInput = {
  name: string;
  gender: KundliGender;
  dateOfBirth: string;
  birthTime: string;
  birthPlace: string;
  /** From a picked place suggestion; without them the server geocodes `birthPlace` */
  lat?: number;
  lon?: number;
  tzone?: number;
  isSelf?: boolean;
};

/** POST /kundli/profiles (the place is geocoded and the summary computed on the server) */
export const createKundliProfile = (body: CreateKundliProfileInput) =>
  request<{ profile: KundliProfile }>('/kundli/profiles', { method: 'POST', body, timeoutMs: 45000 }).then(r => r.profile);

/** GET /kundli/profiles, newest first */
export const listKundliProfiles = () =>
  request<{ profiles: KundliProfile[] }>('/kundli/profiles').then(r => r.profiles);

export const getKundliProfile = (id: string) =>
  request<{ profile: KundliProfile }>(`/kundli/profiles/${id}`).then(r => r.profile);

export const deleteKundliProfile = (id: string) =>
  request<undefined>(`/kundli/profiles/${id}`, { method: 'DELETE' });
