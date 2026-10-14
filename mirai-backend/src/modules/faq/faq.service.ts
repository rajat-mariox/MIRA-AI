import { cache } from '../../lib/cache';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { Faq, type FaqDocument } from './faq.model';
import type { CreateFaqInput, UpdateFaqInput } from './faq.validation';

const SORT = { order: 1, createdAt: 1 } as const;
const PUBLIC_KEY = 'faq:list:active';
const PUBLIC_TTL = 3600;
const invalidate = () => cache.delPattern('faq:*');

export async function listActive() {
  return cache.wrap(PUBLIC_KEY, PUBLIC_TTL, async () => {
    const docs = await Faq.find({ isActive: true }).sort(SORT);
    return docs.map((d) => d.toJSON());
  });
}

export async function listAll(): Promise<FaqDocument[]> {
  return Faq.find().sort(SORT);
}

export async function getById(id: string): Promise<FaqDocument> {
  const faq = await Faq.findById(id);
  if (!faq) throw ApiError.notFound('faq.notFound');
  return faq;
}

export async function create(input: CreateFaqInput): Promise<FaqDocument> {
  const faq = await Faq.create(input);
  await invalidate();
  return faq;
}

export async function update(id: string, input: UpdateFaqInput): Promise<FaqDocument> {
  const faq = await getById(id);
  for (const [k, v] of Object.entries(input)) if (v !== undefined) faq.set(k, v);
  await faq.save();
  await invalidate();
  return faq;
}

export async function remove(id: string): Promise<void> {
  const res = await Faq.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw ApiError.notFound('faq.notFound');
  await invalidate();
}

/** Same texts as the mobile app's (currently static) Help & Support screen. */
const DEFAULT_FAQS = [
  { question: 'How do I improve my KIBIL score?', answer: 'Complete remedies and follow recommendations', order: 1 },
  { question: 'How are consultations charged?', answer: 'Per minute billing based on astrologer rates', order: 2 },
  { question: 'Can I get a refund?', answer: 'Refunds available within 24 hours for select services', order: 3 },
];

/** Seeds the default FAQs only when the collection is empty. */
export async function seedFaqs(): Promise<void> {
  if ((await Faq.estimatedDocumentCount()) > 0) return;
  await Faq.insertMany(DEFAULT_FAQS.map((f) => ({ ...f, isActive: true })));
  await invalidate();
  logger.info(`[faq] Seeded ${DEFAULT_FAQS.length} default FAQs`);
}
