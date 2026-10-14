import { request } from './client';

export type CmsType = 'terms' | 'privacy' | 'about';

export type CmsPage = {
  id: string;
  _id: string;
  type: CmsType;
  title?: string;
  content: string;
  [k: string]: unknown;
};

/** GET /cms?type=terms|privacy|about (public); shown in the app by LegalScreen */
export async function getCmsPage(type: CmsType) {
  return (await request<{ cms: CmsPage }>('/cms', { query: { type }, auth: false })).cms;
}
