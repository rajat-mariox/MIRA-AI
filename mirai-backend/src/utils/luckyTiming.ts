/**
 * Lucky day and lucky time for a sign (Divine's horoscope has neither):
 *   - lucky day  = weekday of the sign's ruling planet (Libra -> Venus -> Friday)
 *   - lucky time = the day's first daytime hora of that planet: sunrise..sunset is split into
 *     12 horas, the first ruled by the weekday's planet, the rest following the Chaldean order.
 * Sunrise/sunset use NOAA's solar equations (within a couple of minutes).
 */
import type { ZodiacSign } from './zodiac';

type Planet = 'sun' | 'moon' | 'mars' | 'mercury' | 'jupiter' | 'venus' | 'saturn';

const SIGN_LORD: Record<ZodiacSign, Planet> = {
  aries: 'mars',
  taurus: 'venus',
  gemini: 'mercury',
  cancer: 'moon',
  leo: 'sun',
  virgo: 'mercury',
  libra: 'venus',
  scorpio: 'mars',
  sagittarius: 'jupiter',
  capricorn: 'saturn',
  aquarius: 'saturn',
  pisces: 'jupiter',
};

/** Weekday (0 = Sunday) each planet rules */
const PLANET_WEEKDAY: Record<Planet, number> = { sun: 0, moon: 1, mars: 2, mercury: 3, jupiter: 4, venus: 5, saturn: 6 };
const WEEKDAY_PLANET: Planet[] = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn'];
/** Hora sequence (slowest to fastest planet) */
const CHALDEAN: Planet[] = ['saturn', 'jupiter', 'mars', 'sun', 'venus', 'mercury', 'moon'];

const WEEKDAY_NAMES: Record<'en' | 'hi', string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
};

const RAD = Math.PI / 180;

/** Sunrise and sunset as minutes after local midnight, or null (polar day / night) */
export function sunTimes(year: number, month: number, day: number, lat: number, lon: number, tzone: number) {
  const n = Math.round((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86_400_000);
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);
  const cosHa = Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl)) - Math.tan(lat * RAD) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null;
  const ha = Math.acos(cosHa) / RAD;
  const toLocal = (utcMin: number) => utcMin + tzone * 60;
  return { sunrise: toLocal(720 - 4 * (lon + ha) - eqTime), sunset: toLocal(720 - 4 * (lon - ha) - eqTime) };
}

function clock(minutes: number): string {
  const m = Math.round(((minutes % 1440) + 1440) % 1440);
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

export interface LuckyTiming {
  /** "Friday" / "शुक्रवार" */
  day: string;
  /** "10:42 AM - 11:39 AM", or null when the sun does not rise/set there */
  time: string | null;
}

/** Lucky day + time for `sign` on the given local date at the given place */
export function luckyTiming(
  sign: ZodiacSign,
  date: { year: number; month: number; day: number },
  place: { lat: number; lon: number; tzone: number },
  lang: 'en' | 'hi' = 'en',
): LuckyTiming {
  const lord = SIGN_LORD[sign];
  const day = WEEKDAY_NAMES[lang][PLANET_WEEKDAY[lord]]!;

  const sun = sunTimes(date.year, date.month, date.day, place.lat, place.lon, place.tzone);
  if (!sun) return { day, time: null };
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  const first = CHALDEAN.indexOf(WEEKDAY_PLANET[weekday]!);
  const horaLength = (sun.sunset - sun.sunrise) / 12;
  for (let i = 0; i < 12; i++) {
    if (CHALDEAN[(first + i) % 7] === lord) {
      const start = sun.sunrise + i * horaLength;
      return { day, time: `${clock(start)} - ${clock(start + horaLength)}` };
    }
  }
  return { day, time: null };
}
