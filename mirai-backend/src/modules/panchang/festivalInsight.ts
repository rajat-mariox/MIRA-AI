import { z } from 'zod';
import { AiProviderError, generateReply, isAiConfigured } from '../../lib/ai';
import { cache } from '../../lib/cache';
import type { Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { ApiError } from '../../utils/ApiError';
import { getUserRashi, type ZodiacSign } from '../../utils/zodiac';
import type { UserDocument } from '../user/user.model';
import type { FestivalInsightQuery } from './panchang.validation';

/*
 * "What this festival means for your rashi": one AI call per festival + date + rashi + language,
 * cached for 30 days. Not a chat message, so it never touches the chat question quota or billing.
 */

const INSIGHT_TTL = 30 * 24 * 3600;
const MAX_ATTEMPTS = 2; // first try + one retry when the reply isn't valid JSON

/** Vedic name, ruling planet and element of each sign (grounds the prompt). */
const RASHI_INFO: Record<ZodiacSign, { vedic: string; planet: string; element: string }> = {
  aries: { vedic: 'Mesha', planet: 'Mars (Mangal)', element: 'Fire' },
  taurus: { vedic: 'Vrishabha', planet: 'Venus (Shukra)', element: 'Earth' },
  gemini: { vedic: 'Mithuna', planet: 'Mercury (Budh)', element: 'Air' },
  cancer: { vedic: 'Karka', planet: 'Moon (Chandra)', element: 'Water' },
  leo: { vedic: 'Simha', planet: 'Sun (Surya)', element: 'Fire' },
  virgo: { vedic: 'Kanya', planet: 'Mercury (Budh)', element: 'Earth' },
  libra: { vedic: 'Tula', planet: 'Venus (Shukra)', element: 'Air' },
  scorpio: { vedic: 'Vrishchika', planet: 'Mars (Mangal)', element: 'Water' },
  sagittarius: { vedic: 'Dhanu', planet: 'Jupiter (Guru)', element: 'Fire' },
  capricorn: { vedic: 'Makara', planet: 'Saturn (Shani)', element: 'Earth' },
  aquarius: { vedic: 'Kumbha', planet: 'Saturn (Shani)', element: 'Air' },
  pisces: { vedic: 'Meena', planet: 'Jupiter (Guru)', element: 'Water' },
};

const text = z.string().trim().min(1).max(1200);
const insightSchema = z.object({
  significance: text,
  forYourRashi: text,
  dos: z.array(z.string().trim().min(1).max(300)).min(2).max(8).transform((a) => a.slice(0, 4)),
  donts: z.array(z.string().trim().min(1).max(300)).min(1).max(8).transform((a) => a.slice(0, 3)),
  luckyColor: z.string().trim().min(1).max(80),
  pujaTip: text,
});

export type FestivalInsight = z.infer<typeof insightSchema>;

export interface FestivalInsightResult {
  festival: string;
  date: string;
  rashi: ZodiacSign;
  insight: FestivalInsight;
}

/** "Diwali / Deepavali!" -> "diwali-deepavali" (keeps Devanagari letters). */
export function festivalSlug(name: string): string {
  return (
    name
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'festival'
  );
}

/** Strip code fences / prose around the object, then validate. Null when unusable. */
export function parseInsight(raw: string): FestivalInsight | null {
  const unfenced = raw.replace(/```(?:json)?/gi, '').trim();
  const start = unfenced.indexOf('{');
  const end = unfenced.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = insightSchema.safeParse(JSON.parse(unfenced.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function systemPrompt(lang: Lang): string {
  const language =
    lang === 'hi'
      ? 'Write every value in Hindi, in Devanagari script (keep the JSON keys in English).'
      : 'Write every value in English.';
  return `You are an experienced, warm Vedic (Jyotish) astrologer inside the MIRAI astrology app.
You explain what a Hindu / Indian festival means spiritually and how a person of a given rashi (moon sign) can best observe it.

Rules:
- Ground "significance" in the festival's traditional meaning: its deity, story, rituals and the season or tithi it falls on. If the festival is regional or less known, describe what is traditionally known and stay general rather than inventing details.
- Ground "forYourRashi" in the given rashi: its ruling planet and element, and how the festival's energy relates to them. Speak to the person directly ("you").
- Concise and warm: "significance" and "forYourRashi" are 2-3 sentences each; every do / don't is one short sentence.
- Astrology describes tendencies, not certainties. Never promise medical, legal or financial outcomes or give such instructions; never frighten the user.
- ${language}

Reply with STRICT JSON only: no markdown, no code fences, no text before or after. Exactly this shape:
{"significance": string, "forYourRashi": string, "dos": [3-4 strings], "donts": [2-3 strings], "luckyColor": string (one colour, 1-3 words), "pujaTip": string (one practical puja or ritual tip, 1-2 sentences)}`;
}

function userPrompt(name: string, date: string, rashi: ZodiacSign): string {
  const r = RASHI_INFO[rashi];
  const weekday = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  return [
    `Festival: ${name}`,
    `Date: ${date} (${weekday})`,
    `Rashi: ${rashi} (${r.vedic}), ruled by ${r.planet}, ${r.element} element`,
  ].join('\n');
}

async function generateInsight(name: string, date: string, rashi: ZodiacSign, lang: Lang): Promise<FestivalInsight> {
  const system = systemPrompt(lang);
  const prompt = userPrompt(name, date, rashi);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let reply;
    try {
      reply = await generateReply({
        system,
        messages: [
          {
            role: 'user',
            content: attempt === 1 ? prompt : `${prompt}\n\nYour previous reply was not valid JSON. Reply with the JSON object only.`,
          },
        ],
        maxTokens: 1200,
      });
    } catch (err) {
      if (err instanceof AiProviderError) throw new ApiError(502, 'festival.insightFailed');
      throw err;
    }
    const insight = parseInsight(reply.text);
    if (insight) return insight;
    logger.warn({ attempt, festival: name, preview: reply.text.slice(0, 200) }, '[festival] insight reply was not valid JSON');
  }
  throw new ApiError(502, 'festival.insightFailed');
}

export async function festivalInsight(user: UserDocument, q: FestivalInsightQuery, lang: Lang): Promise<FestivalInsightResult> {
  const rashi = (q.sign as ZodiacSign | undefined) ?? getUserRashi(user.fullName, user.dateOfBirth);
  if (!rashi) throw new ApiError(422, 'festival.rashiRequired');
  const key = `panchang:festivalInsight:${festivalSlug(q.name)}:${q.date}:${rashi}:${lang}`;
  // Cached insights stay readable even if the AI provider is switched off later
  const insight = await cache.wrap(key, INSIGHT_TTL, () => {
    if (!isAiConfigured()) throw new ApiError(503, 'festival.insightUnavailable');
    return generateInsight(q.name, q.date, rashi, lang);
  });
  return { festival: q.name, date: q.date, rashi, insight };
}
