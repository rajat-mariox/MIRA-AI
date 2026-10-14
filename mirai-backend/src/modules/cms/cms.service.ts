import { cache } from '../../lib/cache';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { Cms, type CmsDocument, type CmsType } from './cms.model';
import type { UpdateCmsInput, UpsertCmsInput } from './cms.validation';

const PUBLIC_TTL = 3600;
const publicKey = (type: string) => `cms:page:${type}`;
const invalidate = () => cache.delPattern('cms:*');

export async function getPublicPage(type: CmsType) {
  const page = await cache.wrap(publicKey(type), PUBLIC_TTL, async () => {
    const doc = await Cms.findOne({ type, isActive: true });
    return doc ? doc.toJSON() : null;
  });
  if (!page) throw ApiError.notFound('cms.notFound');
  return page;
}

export async function listAll(): Promise<CmsDocument[]> {
  return Cms.find().sort({ type: 1 });
}

export async function getById(id: string): Promise<CmsDocument> {
  const doc = await Cms.findById(id);
  if (!doc) throw ApiError.notFound('cms.notFound');
  return doc;
}

export async function upsert(input: UpsertCmsInput): Promise<{ doc: CmsDocument; created: boolean }> {
  let doc = await Cms.findOne({ type: input.type });
  const created = !doc;
  if (!doc) doc = new Cms({ type: input.type });
  doc.content = input.content;
  if (input.title !== undefined) doc.title = input.title;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  await doc.save();
  await invalidate();
  return { doc, created };
}

export async function update(id: string, input: UpdateCmsInput): Promise<CmsDocument> {
  const doc = await getById(id);
  for (const [k, v] of Object.entries(input)) if (v !== undefined) doc.set(k, v);
  await doc.save();
  await invalidate();
  return doc;
}

export async function remove(id: string): Promise<void> {
  const res = await Cms.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw ApiError.notFound('cms.notFound');
  await invalidate();
}

const DEFAULT_PAGES: Array<{ type: CmsType; title: string; content: string }> = [
  {
    type: 'terms',
    title: 'Terms & Conditions',
    content:
      '<h2>Terms &amp; Conditions</h2>' +
      '<p>Welcome to MIRAI. By creating an account or using the MIRAI app you agree to these terms.</p>' +
      '<h3>1. Use of the service</h3><p>MIRAI provides astrology insights, horoscopes and AI-assisted guidance for personal and entertainment purposes. It is not a substitute for professional medical, legal or financial advice.</p>' +
      '<h3>2. Your account</h3><p>You are responsible for keeping your login credentials secure and for all activity on your account. Provide accurate birth details for the best results.</p>' +
      '<h3>3. Payments</h3><p>Paid plans and questions are charged as shown in the app at the time of purchase. Refunds are handled according to our refund policy.</p>' +
      '<h3>4. Changes</h3><p>We may update these terms from time to time. Continued use of the app means you accept the updated terms.</p>' +
      '<p>Questions? Contact us at support@miraiastro.com.</p>',
  },
  {
    type: 'privacy',
    title: 'Privacy Policy',
    content:
      '<h2>Privacy Policy</h2>' +
      '<p>Your privacy matters to us. This policy explains what we collect and how we use it.</p>' +
      '<h3>Information we collect</h3><p>Your email address, the birth details you provide (date, time and place of birth), device information and usage data.</p>' +
      '<h3>How we use it</h3><p>To create your account, generate personalised astrology readings, send notifications you opt into, process payments and improve the app.</p>' +
      '<h3>Sharing</h3><p>We do not sell your personal data. We share it only with service providers that help us run MIRAI (hosting, email, payments, push notifications) under strict confidentiality.</p>' +
      '<h3>Your choices</h3><p>You can update your profile at any time and request deletion of your account by contacting support@miraiastro.com.</p>',
  },
  {
    type: 'about',
    title: 'About MIRAI',
    content:
      '<h2>About MIRAI</h2>' +
      '<p>MIRAI blends traditional Vedic astrology with modern AI to give you clear, personal guidance every day.</p>' +
      '<p>Get daily horoscopes, explore your birth chart, check compatibility and ask our AI astrologer the questions that matter to you.</p>' +
      '<p>Visit <a href="https://miraiastro.com">miraiastro.com</a> to learn more.</p>',
  },
];

/** Inserts the default Terms / Privacy / About pages for any type that has no document yet. */
export async function seedCms(): Promise<void> {
  let n = 0;
  for (const page of DEFAULT_PAGES) {
    const r = await Cms.updateOne({ type: page.type }, { $setOnInsert: { ...page, isActive: true } }, { upsert: true });
    n += r.upsertedCount;
  }
  if (n) logger.info(`[cms] Seeded ${n} default page(s)`);
}
