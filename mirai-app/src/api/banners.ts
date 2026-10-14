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
