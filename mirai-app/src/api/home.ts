import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from './client';
import type { Banner } from './banners';
import type { HoroscopeResult } from './horoscope';
import type { MuhuratSummary } from './panchang';
import type { User } from './user';

export type HomePartError = { statusCode: number; message: string };

export type HomeData = {
  user: User;
  horoscope: HoroscopeResult | null;
  panchang: MuhuratSummary | null;
  banners: Banner[] | null;
  wallet: { balance: number };
  /** per-part failures; empty when everything loaded */
  errors: Partial<Record<'horoscope' | 'panchang' | 'banners', HomePartError>>;
};

/** GET /home/user/home */
export function getHome() {
  return request<HomeData>('/home/user/home');
}

// The last Home response (per user, per day), shown at once on the next launch while a fresh
// one loads. Read from storage once, as soon as this module loads.
const CACHE_KEY = 'mirai.home';
type CachedHome = { userId: string; day: string; data: HomeData };

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const cacheReady: Promise<CachedHome | null> = AsyncStorage.getItem(CACHE_KEY)
  .then(raw => (raw ? (JSON.parse(raw) as CachedHome) : null))
  .catch(() => null);

/** Today's cached Home data for this user, or null (another user, another day, nothing saved) */
export async function loadCachedHome(userId: string): Promise<HomeData | null> {
  const c = await cacheReady;
  return c && c.userId === userId && c.day === todayKey() ? c.data : null;
}

export function saveCachedHome(userId: string, data: HomeData): void {
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ userId, day: todayKey(), data })).catch(() => {});
}
