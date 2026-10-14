import type { HoroscopeData } from '../api/horoscope';
import type { MuhuratRating } from '../components/panchang/AuspiciousTimings';

/** "2026-10-14 15:15:00" (or ISO / "15:15") -> "03:15 PM" */
export function formatClock(value: string | null | undefined): string {
  if (!value) return '';
  const m = /(\d{1,2}):(\d{2})/.exec(value.replace(/^\d{4}-\d{2}-\d{2}[ T]/, ''));
  if (!m) return value;
  const h = Number(m[1]);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return '';
  return `${formatClock(start)} - ${formatClock(end)}`;
}

/**
 * Classical muhurat traits used for the badge and "Recommended for" line (these describe
 * the muhurat itself; the timings come from the API).
 */
export const MUHURAT_INFO: Record<
  string,
  { name: string; rating: MuhuratRating; recommendedFor: string }
> = {
  brahma_muhurta: {
    name: 'Brahma Muhurat',
    rating: 'highly-auspicious',
    recommendedFor: 'Meditation, Spiritual Practices',
  },
  abhijit_muhurta: {
    name: 'Abhijit Muhurat',
    rating: 'auspicious',
    recommendedFor: 'Important Tasks, New Ventures',
  },
  vijay_muhurta: {
    name: 'Vijay Muhurat',
    rating: 'very-good',
    recommendedFor: 'Business, Meetings, Partnerships',
  },
  godhuli_muhurta: {
    name: 'Godhuli Muhurat',
    rating: 'auspicious',
    recommendedFor: 'Marriage, Family Ceremonies',
  },
  amrit_kalam: {
    name: 'Amrit Kalam',
    rating: 'highly-auspicious',
    recommendedFor: 'Auspicious Beginnings, Prayers',
  },
};

/** Divine returns `{start_time,end_time}`, `[]` or an array of those. */
export function firstRange(v: unknown): { start: string; end: string } | null {
  const arr = Array.isArray(v) ? v : v ? [v] : [];
  const r = arr.find(x => x && typeof x === 'object' && 'start_time' in x) as
    | { start_time: string; end_time: string }
    | undefined;
  return r ? { start: r.start_time, end: r.end_time } : null;
}

export function percentOf(h: HoroscopeData | undefined, key: string): number | undefined {
  const v = h?.special?.horoscope_percentage?.[key];
  return typeof v === 'number' ? v : undefined;
}

export function percentText(p: number | undefined): string {
  return p === undefined ? '--' : `${Math.round(p)}%`;
}

/** "today" / "this week" / "this month" / "this year" for a horoscope period label. */
export function periodPhrase(period: string): string {
  if (period.startsWith('daily-tomorrow')) return 'tomorrow';
  if (period.startsWith('daily')) return 'today';
  if (period === 'weekly') return 'this week';
  if (period === 'monthly') return 'this month';
  return 'this year';
}

type Level = 'high' | 'mid' | 'low';
const level = (p: number | undefined): Level => (p === undefined ? 'mid' : p >= 70 ? 'high' : p >= 50 ? 'mid' : 'low');

/** One-line forecast summaries derived from the API percentages. */
export function forecastSummary(kind: 'general' | 'health' | 'love' | 'work', p: number | undefined, when: string) {
  const l = level(p);
  switch (kind) {
    case 'general':
      return `Your luck ${when}`;
    case 'health':
      return l === 'high' ? 'Your energy is high' : l === 'mid' ? 'Your energy is steady' : 'Your energy is low';
    case 'love':
      return l === 'high' ? 'Good time for Love' : l === 'mid' ? 'Steady in Love' : 'Go slow in Love';
    case 'work':
      return l === 'high' ? 'Strong work pace' : l === 'mid' ? 'Moderate work pace' : 'Slow work pace';
  }
}

/** First sentence of a prediction (for short card descriptions). */
export function firstSentence(text: string | undefined): string {
  if (!text) return '';
  const m = /^(.+?[.!?])(\s|$)/.exec(text.trim());
  return (m ? m[1] : text).trim();
}

/** "Lucky Numbers of the day : 3, 5, 8" -> value of the first line whose label matches. */
export function luckValue(lines: string[] | undefined, pattern: RegExp): string | undefined {
  const line = lines?.find(l => pattern.test(l.split(':')[0] ?? ''));
  if (!line) return undefined;
  const i = line.indexOf(':');
  return (i >= 0 ? line.slice(i + 1) : line).trim() || undefined;
}
