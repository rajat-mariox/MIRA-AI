/**
 * GET /horoscope/insights/:topic — Career / Finance / Marriage / Health insight pages.
 *
 * Own rashi (no `sign` override): AI reading from the user's real astro context (today's
 * horoscope + kundli basics + planetary positions + running dasha, see chat.integrations
 * getAstroContext), cached per user + topic + local date + lang. Any other sign (or AI failure):
 * built from that sign's generic daily/weekly/monthly/yearly horoscope text, `personalized: false`.
 */
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { generateReply, isAiConfigured } from '../../lib/ai';
import { cache } from '../../lib/cache';
import { translate, type Lang } from '../../lib/i18n';
import { logger } from '../../lib/logger';
import { localDateParts, secondsUntilLocal } from '../../utils/astroTime';
import { getUserRashi, type ZodiacSign } from '../../utils/zodiac';
import { getAstroContext } from '../chat/chat.integrations';
import type { UserDocument } from '../user/user.model';
import { fetchHoroscope, type HoroscopeData, type HoroscopeSetupRequired } from './horoscope.service';
import type { InsightTopic } from './horoscope.validation';

export type InsightPeriodId = 'week' | 'month' | 'year';

export interface InsightData {
  topic: InsightTopic;
  sign: ZodiacSign;
  personalized: boolean;
  score: number | null;
  today: string;
  periods: Array<{ id: InsightPeriodId; title: string; text: string }>;
  remedies: string[];
  basis: string;
}

export type InsightResult = { ok: true; data: InsightData } | { ok: false; setup: HoroscopeSetupRequired };

type TextField = 'profession' | 'emotions' | 'health';

/** Generic horoscope category per topic + the horoscope_percentage key used for the score. */
const GENERIC: Record<InsightTopic, { field: TextField; scoreKey: string }> = {
  career: { field: 'profession', scoreKey: 'profession' },
  finance: { field: 'profession', scoreKey: 'luck' },
  marriage: { field: 'emotions', scoreKey: 'emotions' },
  health: { field: 'health', scoreKey: 'health' },
};

/** Chart factors the AI should look at per topic. */
const FOCUS: Record<InsightTopic, string> = {
  career: 'career and profession: the 10th house, its sign and lord, planets placed in the 10th, Saturn and the Sun',
  finance: 'money and wealth: the 2nd and 11th houses and their lords, Jupiter and Venus',
  marriage: 'love, relationships and marriage: the 7th house and its lord, Venus and Jupiter (and the Moon for emotions)',
  health: 'health and vitality: the 6th and 8th houses, the ascendant and its lord, the Moon and the Sun',
};

const PERIOD_IDS: InsightPeriodId[] = ['week', 'month', 'year'];
const PERIOD_TITLE_KEYS: Record<InsightPeriodId, string> = {
  week: 'horoscope.insightPeriodWeek',
  month: 'horoscope.insightPeriodMonth',
  year: 'horoscope.insightPeriodYear',
};

const aiInsightSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  today: z.string().trim().min(20),
  week: z.string().trim().min(10),
  month: z.string().trim().min(10),
  year: z.string().trim().min(10),
  remedies: z.array(z.string().trim().min(3)).min(3),
});
type AiInsight = z.infer<typeof aiInsightSchema>;

const cap = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

function periodsOf(lang: Lang, texts: Record<InsightPeriodId, string>): InsightData['periods'] {
  return PERIOD_IDS.map((id) => ({ id, title: translate(lang, PERIOD_TITLE_KEYS[id]), text: texts[id] }));
}

function genericRemedies(topic: InsightTopic, lang: Lang): string[] {
  return [1, 2, 3].map((n) => translate(lang, `horoscope.remedy.${topic}.${n}`));
}

function signName(sign: ZodiacSign, lang: Lang): string {
  return translate(lang, `horoscope.sign.${sign}`) || cap(sign);
}

// ─── Generic (any sign) ─────────────────────────────────────────────────────────

async function genericInsight(topic: InsightTopic, sign: ZodiacSign, tzone: number, lang: Lang): Promise<InsightData> {
  const { field, scoreKey } = GENERIC[topic];
  const safe = (p: Promise<HoroscopeData>) =>
    p.catch((err: unknown) => {
      logger.warn({ err, sign }, '[horoscope] insight period unavailable');
      return null;
    });
  // Daily is required (errors propagate); the longer periods are best effort
  const [daily, weekly, monthly, yearly] = await Promise.all([
    fetchHoroscope(sign, 'daily', 'today', tzone, lang),
    safe(fetchHoroscope(sign, 'weekly', 'today', tzone, lang)),
    safe(fetchHoroscope(sign, 'monthly', 'today', tzone, lang)),
    safe(fetchHoroscope(sign, 'yearly', 'today', tzone, lang)),
  ]);
  const text = (h: HoroscopeData | null) => h?.prediction[field] ?? '';
  let today = text(daily);
  if (topic === 'finance') {
    // Divine has no finance category: work & money text + today's lucky colours / numbers
    const luck = daily.prediction.luck.slice(0, 2).join(' · ');
    if (luck) today = `${today}${today ? '\n\n' : ''}${luck}`;
  }
  const score = daily.special?.horoscope_percentage?.[scoreKey];
  return {
    topic,
    sign,
    personalized: false,
    score: typeof score === 'number' ? Math.round(score) : null,
    today,
    periods: periodsOf(lang, { week: text(weekly), month: text(monthly), year: text(yearly) }),
    remedies: genericRemedies(topic, lang),
    basis: translate(lang, 'horoscope.insightBasisGeneric', { sign: signName(sign, lang) }),
  };
}

// ─── Personalised (own chart, AI) ───────────────────────────────────────────────

function stripFences(text: string): string {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  return start >= 0 && end > start ? t.slice(start, end + 1) : t;
}

/** Houses + karaka planets per topic, used to pre-compute the topic factors from the chart. */
const TOPIC_HOUSES: Record<InsightTopic, { houses: number[]; planets: string[] }> = {
  career: { houses: [10], planets: ['Saturn', 'Sun'] },
  finance: { houses: [2, 11], planets: ['Jupiter', 'Venus'] },
  marriage: { houses: [7], planets: ['Venus', 'Jupiter'] },
  health: { houses: [6, 8, 1], planets: ['Moon', 'Sun'] },
};
const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;

/**
 * Topic houses (sign, lord and where the lord sits, occupants) + karaka placements, computed from
 * the "Planetary positions" lines of the context so the AI doesn't have to count houses. Null
 * when the positions can't be read (e.g. names not in English).
 */
function topicFactors(topic: InsightTopic, context: string): string | null {
  const planets = new Map<string, { sign: string; house: number }>();
  for (const m of context.matchAll(/^- (\w+): (\w+), house (\d+)/gm)) {
    planets.set(m[1]!, { sign: m[2]!, house: Number(m[3]) });
  }
  const asc = planets.get('Ascendant');
  const ascIdx = asc ? SIGN_NAMES.indexOf(asc.sign) : -1;
  if (ascIdx < 0) return null;
  const where = (name: string) => {
    const p = planets.get(name);
    return p ? `${p.sign} (${ordinal(p.house)} house)` : null;
  };
  const lines: string[] = [];
  for (const h of TOPIC_HOUSES[topic].houses) {
    const idx = (ascIdx + h - 1) % 12;
    const lord = SIGN_LORDS[idx]!;
    const occupants = [...planets.entries()].filter(([n, p]) => n !== 'Ascendant' && p.house === h).map(([n]) => n);
    const lordAt = where(lord);
    lines.push(
      `- ${ordinal(h)} house: ${SIGN_NAMES[idx]}; its lord ${lord}${lordAt ? ` sits in ${lordAt}` : ''}; ` +
        (occupants.length ? `planets in it: ${occupants.join(', ')}` : 'no planets in it'),
    );
  }
  for (const k of TOPIC_HOUSES[topic].planets) {
    const at = where(k);
    if (at) lines.push(`- ${k} in ${at}`);
  }
  return lines.join('\n');
}

function buildPrompt(topic: InsightTopic, context: string, lang: Lang): string {
  const factors = topicFactors(topic, context);
  return [
    'You are MIRAI, a careful Vedic astrologer writing a personalised insight card for one person.',
    `Topic: ${FOCUS[topic]}.`,
    '',
    "The person's real astrological data (the ONLY facts you may use):",
    '"""',
    context,
    '"""',
    ...(factors ? ['', 'Topic factors (computed from the chart above; build the reading on these):', factors] : []),
    '',
    'Rules:',
    '- Use ONLY placements, signs, houses, nakshatras and dasha periods that appear in the data above. Never invent a placement, a house lord or a dasha that is not stated. If a house has no planet listed, you may name its sign and lord but do not claim a planet is there.',
    "- `today`: 2-4 sentences about today for this topic. Name 1-2 of the topic factors (house / lord / karaka placements) and the running mahadasha-antardasha (if given), and blend in today's horoscope for this topic.",
    '- `week`, `month`, `year`: 2-3 sentences each, forward-looking for this topic, grounded in the same chart factors and dasha.',
    '- `remedies`: exactly 3 short (max 15 words), practical Vedic remedies for this topic, tied to the planets you mentioned.',
    "- `score`: an integer 0-100 for today's outlook in this topic (use today's horoscope percentages as a hint).",
    '- Warm, specific, non-fatalistic. No medical, legal or financial guarantees.',
    lang === 'hi'
      ? '- Write every text value in natural Hindi (Devanagari script); keep the JSON keys in English.'
      : '- Write every text value in English.',
    '',
    'Answer with STRICT JSON only (no markdown, no code fences, no commentary):',
    '{"score": 0-100, "today": "...", "week": "...", "month": "...", "year": "...", "remedies": ["...", "...", "..."]}',
  ].join('\n');
}

async function askAi(topic: InsightTopic, context: string, lang: Lang): Promise<AiInsight | null> {
  const system = buildPrompt(topic, context, lang);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { text } = await generateReply({
        system,
        messages: [{ role: 'user', content: `Write my ${topic} insight as strict JSON.` }],
        maxTokens: 1200,
      });
      const parsed = aiInsightSchema.safeParse(JSON.parse(stripFences(text)));
      if (parsed.success) return parsed.data;
      logger.warn({ topic, attempt, issues: parsed.error.issues }, '[horoscope] AI insight failed validation');
    } catch (err) {
      logger.warn({ err, topic, attempt }, '[horoscope] AI insight failed');
    }
  }
  return null;
}

/** "Leo" ascendant and "Rahu–Mercury" dasha read back from the context text (for the subtitle). */
function basisOf(context: string, lang: Lang): string {
  // English names from Divine -> localised (horoscope.sign.* / horoscope.planet.*), else as they came
  const local = (prefix: string, name: string | undefined) => {
    if (!name) return name;
    const key = `${prefix}.${name.toLowerCase()}`;
    const t = translate(lang, key);
    return t === key ? name : t;
  };
  const asc = local('horoscope.sign', /Ascendant \(Lagna\):\s*([^\n]+)/.exec(context)?.[1]?.trim());
  const maha = local('horoscope.planet', /Mahadasha:\s*([^\s(]+)/.exec(context)?.[1]?.trim());
  const antar = local('horoscope.planet', /Antardasha:\s*([^\s(]+)/.exec(context)?.[1]?.trim());
  const dasha = maha ? (antar ? `${maha}–${antar}` : maha) : '';
  if (asc && dasha) return translate(lang, 'horoscope.insightBasisFull', { ascendant: asc, dasha });
  if (asc) return translate(lang, 'horoscope.insightBasisAscendant', { ascendant: asc });
  return translate(lang, 'horoscope.insightBasisChart');
}

async function personalInsight(
  user: UserDocument,
  topic: InsightTopic,
  sign: ZodiacSign,
  tzone: number,
  lang: Lang,
): Promise<InsightData | null> {
  if (!isAiConfigured()) return null;
  const context = await getAstroContext(user, lang);
  // Without the birth chart this would only be the generic horoscope again
  if (!context || !context.includes('Planetary positions')) return null;

  const today = localDateParts(tzone);
  const ctxHash = createHash('sha256').update(context).digest('hex').slice(0, 12);
  const key = `horoscope:insight:${String(user._id)}:${topic}:${today.iso}:${lang}:${ctxHash}`;
  const hit = await cache.get<InsightData>(key);
  if (hit) return hit;

  const ai = await askAi(topic, context, lang);
  if (!ai) return null;
  const data: InsightData = {
    topic,
    sign,
    personalized: true,
    score: Math.round(ai.score),
    today: ai.today,
    periods: periodsOf(lang, { week: ai.week, month: ai.month, year: ai.year }),
    remedies: ai.remedies.slice(0, 3),
    basis: basisOf(context, lang),
  };
  const ttl = Math.min(24 * 3600, secondsUntilLocal(tzone, today.year, today.month, today.day + 1));
  await cache.set(key, data, ttl);
  return data;
}

export async function getInsight(
  user: UserDocument,
  topic: InsightTopic,
  signOverride: ZodiacSign | undefined,
  lang: Lang,
): Promise<InsightResult> {
  const rashi = getUserRashi(user.fullName, user.dateOfBirth);
  const sign = signOverride ?? rashi;
  if (!sign) {
    return {
      ok: false,
      setup: {
        requiresProfileSetup: true,
        profileSetupStep: user.profileSetupStep ?? 0,
        isProfileComplete: user.isProfileComplete ?? false,
      },
    };
  }
  const tzone = user.tzone ?? 5.5;
  if (sign === rashi) {
    const personal = await personalInsight(user, topic, sign, tzone, lang).catch((err: unknown) => {
      logger.warn({ err, topic }, '[horoscope] personalised insight unavailable');
      return null;
    });
    if (personal) return { ok: true, data: personal };
  }
  return { ok: true, data: await genericInsight(topic, sign, tzone, lang) };
}
