/**
 * Pure normalisers for Divine horoscope responses. Daily uses `prediction`, weekly
 * `weekly_horoscope`, monthly `monthly_horoscope`, yearly `yearly_horoscope`; all map to
 * one `prediction` shape.
 */

export interface HoroscopePrediction {
  personal: string;
  health: string;
  profession: string;
  emotions: string;
  travel: string;
  /** "Label : value" strings, e.g. "Colors of the day : Goldenrod, Teal". */
  luck: string[];
}

export interface HoroscopeSpecial {
  lucky_color_codes: string[];
  horoscope_percentage: Record<string, number>;
  [k: string]: unknown;
}

export interface NormalizedHoroscope {
  prediction: HoroscopePrediction;
  special?: HoroscopeSpecial;
}

const PREDICTION_KEYS = ['prediction', 'weekly_horoscope', 'monthly_horoscope', 'yearly_horoscope'] as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v));

export function normalizeHoroscope(raw: unknown): NormalizedHoroscope {
  const d = isObj(raw) ? raw : {};
  const key = PREDICTION_KEYS.find((k) => isObj(d[k]));
  const p: Obj = key ? (d[key] as Obj) : {};

  const luckRaw = p.luck;
  const luck = Array.isArray(luckRaw)
    ? luckRaw.map(str).filter(Boolean)
    : typeof luckRaw === 'string' && luckRaw.trim()
      ? [luckRaw.trim()]
      : [];

  const out: NormalizedHoroscope = {
    prediction: {
      personal: str(p.personal),
      health: str(p.health),
      profession: str(p.profession),
      emotions: str(p.emotions),
      travel: str(p.travel),
      luck,
    },
  };

  if (isObj(d.special)) {
    const s = d.special;
    const pct: Record<string, number> = {};
    if (isObj(s.horoscope_percentage)) {
      for (const [k, v] of Object.entries(s.horoscope_percentage)) {
        const n = Number(v);
        if (Number.isFinite(n)) pct[k] = n;
      }
    }
    out.special = {
      ...s,
      lucky_color_codes: Array.isArray(s.lucky_color_codes) ? s.lucky_color_codes.map(str).filter(Boolean) : [],
      horoscope_percentage: pct,
    };
  }
  return out;
}
