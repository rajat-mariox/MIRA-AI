import { request } from './client';

export type Faq = {
  id: string;
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

/** GET /faq (public, active, by order) */
export async function getFaqs() {
  return (await request<{ faqs: Faq[] }>('/faq', { auth: false })).faqs;
}
