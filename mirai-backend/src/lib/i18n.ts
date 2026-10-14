import fs from 'node:fs';
import path from 'node:path';
import type { Request } from 'express';
import { logger } from './logger';

/**
 * i18n. Messages live in src/locales/<lang>.json as FLAT keys, e.g.
 *   { "auth.otpSent": "OTP sent successfully. Please check your email." }
 * Interpolation: "Hello {{name}}" + params { name: 'Asha' }.
 * Lookup order: requested lang -> en -> the key itself.
 */
export const SUPPORTED_LANGS = ['en', 'hi'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export type TParams = Record<string, string | number | boolean | null | undefined>;

const messages: Record<Lang, Record<string, string>> = { en: {}, hi: {} };

function loadLocales(): void {
  const dir = path.join(__dirname, '..', 'locales');
  for (const lang of SUPPORTED_LANGS) {
    const file = path.join(dir, `${lang}.json`);
    try {
      messages[lang] = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
    } catch (err) {
      logger.error({ err, file }, `Failed to load locale "${lang}"`);
    }
  }
}
loadLocales();

/** Parses an Accept-Language header ("hi-IN,hi;q=0.9,en;q=0.8") into a supported language. */
export function resolveLang(header: string | undefined | null): Lang {
  if (!header) return DEFAULT_LANG;
  const candidates = header
    .split(',')
    .map((part) => {
      const [tag, ...rest] = part.trim().split(';');
      const q = rest.find((r) => r.trim().startsWith('q='));
      return { tag: (tag ?? '').toLowerCase().split('-')[0] ?? '', q: q ? Number(q.split('=')[1]) : 1 };
    })
    .filter((c) => c.tag)
    .sort((a, b) => b.q - a.q);
  for (const c of candidates) {
    if ((SUPPORTED_LANGS as readonly string[]).includes(c.tag)) return c.tag as Lang;
  }
  return DEFAULT_LANG;
}

function interpolate(msg: string, params?: TParams): string {
  if (!params) return msg;
  return msg.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) =>
    params[k] === undefined || params[k] === null ? '' : String(params[k]),
  );
}

/** Translate a key for an explicit language. */
export function translate(lang: Lang, key: string, params?: TParams): string {
  const msg = messages[lang]?.[key] ?? messages[DEFAULT_LANG][key] ?? key;
  return interpolate(msg, params);
}

/** Translate a key using the request's language (req.lang, set by the i18n middleware). */
export function t(req: Request | undefined, key: string, params?: TParams): string {
  return translate(req?.lang ?? DEFAULT_LANG, key, params);
}

/** True if the key exists in the default locale (useful to detect raw messages vs keys). */
export function hasKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(messages[DEFAULT_LANG], key);
}
