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
