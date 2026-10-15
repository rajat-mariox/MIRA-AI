import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from './client';

export type Banner = {
  id: string;
  _id: string;
  title: string;
  subtitle?: string;
  /** button label on the banner (default "View Today") */
  buttonText?: string;
  /** absolute URL or a path on the API server ("/uploads/banners/x.png") */
  imageUrl: string;
  /** a URL to open, or an in-app route name ("Horoscope", "Kundli", "Panchang", "Wallet") */
  link: string;
  isActive: boolean;
  order: number;
};

/** GET /banners (public, active, by order) */
export async function getBanners() {
  return (await request<{ banners: Banner[] }>('/banners', { auth: false })).banners;
}

// Last banners seen, so Home shows them (and their already-downloaded images) right away
// instead of waiting for the network. Read from storage once, as soon as this module loads.
const CACHE_KEY = 'mirai.banners';
let cachedBanners: Banner[] | null = null;
const cacheReady: Promise<Banner[] | null> = AsyncStorage.getItem(CACHE_KEY)
  .then(raw => {
    const list = raw ? (JSON.parse(raw) as Banner[]) : null;
    if (!cachedBanners && Array.isArray(list)) cachedBanners = list;
    return cachedBanners;
  })
  .catch(() => null);

/** Banners from the last session (null until storage has been read, or when there are none) */
export function getCachedBanners(): Banner[] | null {
  return cachedBanners;
}

export function loadCachedBanners(): Promise<Banner[] | null> {
  return cacheReady;
}

export function saveCachedBanners(banners: Banner[]): void {
  cachedBanners = banners;
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(banners)).catch(() => {});
}
