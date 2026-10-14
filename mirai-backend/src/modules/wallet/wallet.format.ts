import { translate, type Lang } from '../../lib/i18n';
import { IST_TIMEZONE } from './wallet.config';

/** Date/time helpers for the wallet screens. Everything is rendered in IST (Asia/Kolkata). */

const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: IST_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: IST_TIMEZONE, hour: 'numeric', minute: '2-digit', hour12: true });
const dayFmt: Record<Lang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-IN', { timeZone: IST_TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' }),
  hi: new Intl.DateTimeFormat('hi-IN', { timeZone: IST_TIMEZONE, day: 'numeric', month: 'long', year: 'numeric' }),
};

/** "2026-10-14" — the IST calendar day of `d`. */
export function istDateKey(d: Date): string {
  return keyFmt.format(d);
}

/** "10:32 AM" in IST. */
export function istTime(d: Date): string {
  return timeFmt.format(d);
}

/** "Today" | "Yesterday" | "12 Mar 2026" (localized). */
export function istDayLabel(lang: Lang, d: Date, now: Date = new Date()): string {
  const key = istDateKey(d);
  if (key === istDateKey(now)) return translate(lang, 'wallet.today');
  if (key === istDateKey(new Date(now.getTime() - 86_400_000))) return translate(lang, 'wallet.yesterday');
  return dayFmt[lang].format(d);
}

/** "just now" | "5 minutes ago" | "2 hours ago" | "yesterday" | "3 days ago" ... (localized). */
export function relativeTime(lang: Lang, d: Date, now: Date = new Date()): string {
  const diffSec = Math.round((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return translate(lang, 'wallet.justNow');
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, 'day');
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}
