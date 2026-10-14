import type React from 'react';
import type { SvgProps } from 'react-native-svg';
import Aries from '../../assets/images/horoscope-zodiac-aries.svg';
import Taurus from '../../assets/images/horoscope-zodiac-taurus.svg';
import Gemini from '../../assets/images/horoscope-zodiac-gemini.svg';
import Cancer from '../../assets/images/horoscope-zodiac-cancer.svg';
import Leo from '../../assets/images/horoscope-zodiac-leo.svg';
import Virgo from '../../assets/images/horoscope-zodiac-virgo.svg';
import Libra from '../../assets/images/horoscope-zodiac-libra.svg';
import Scorpio from '../../assets/images/horoscope-zodiac-scorpio.svg';
import Sagittarius from '../../assets/images/horoscope-zodiac-sagittarius.svg';
import Capricorn from '../../assets/images/horoscope-zodiac-capricorn.svg';
import Aquarius from '../../assets/images/horoscope-zodiac-aquarius.svg';
import Pisces from '../../assets/images/horoscope-zodiac-pisces.svg';
import AriesSmall from '../../assets/images/horoscope-zodiac-aries-small.svg';
import TaurusSmall from '../../assets/images/horoscope-zodiac-taurus-small.svg';
import GeminiSmall from '../../assets/images/horoscope-zodiac-gemini-small.svg';
import CancerSmall from '../../assets/images/horoscope-zodiac-cancer-small.svg';
import LibraSmall from '../../assets/images/horoscope-zodiac-libra-small.svg';

export type ZodiacKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

type Glyph = { Icon: React.FC<SvgProps>; width: number; height: number };

export type ZodiacSign = {
  key: ZodiacKey;
  name: string;
  dates: string;
  /** constellation art used in the 74.75dp / 72dp circles (natural SVG size) */
  glyph: Glyph;
};

// Order and art from the Horoscope detail frame. The design showed Taurus' dates under
// Gemini; every sign uses the usual tropical ranges (matches the backend's getSunSign).
export const ZODIAC_SIGNS: ZodiacSign[] = [
  { key: 'aries', name: 'Aries', dates: 'Mar 21 - Apr 19', glyph: { Icon: Aries, width: 54, height: 30 } },
  { key: 'taurus', name: 'Taurus', dates: 'Apr 20 - May 20', glyph: { Icon: Taurus, width: 48, height: 33 } },
  { key: 'gemini', name: 'Gemini', dates: 'May 21 - Jun 20', glyph: { Icon: Gemini, width: 48, height: 34 } },
  { key: 'cancer', name: 'Cancer', dates: 'Jun 21 - Jul 22', glyph: { Icon: Cancer, width: 35, height: 36 } },
  { key: 'leo', name: 'Leo', dates: 'Jul 23 - Aug 22', glyph: { Icon: Leo, width: 25, height: 40 } },
  { key: 'virgo', name: 'Virgo', dates: 'Aug 23 - Sep 22', glyph: { Icon: Virgo, width: 26, height: 36 } },
  { key: 'libra', name: 'Libra', dates: 'Sep 23 - Oct 22', glyph: { Icon: Libra, width: 31, height: 40 } },
  { key: 'scorpio', name: 'Scorpio', dates: 'Oct 23 - Nov 21', glyph: { Icon: Scorpio, width: 37, height: 40 } },
  {
    key: 'sagittarius',
    name: 'Sagittarius',
    dates: 'Nov 22 - Dec 21',
    glyph: { Icon: Sagittarius, width: 40, height: 41 },
  },
  { key: 'capricorn', name: 'Capricorn', dates: 'Dec 22 - Jan 19', glyph: { Icon: Capricorn, width: 54, height: 39 } },
  { key: 'aquarius', name: 'Aquarius', dates: 'Jan 20 - Feb 18', glyph: { Icon: Aquarius, width: 30, height: 41 } },
  { key: 'pisces', name: 'Pisces', dates: 'Feb 19 - Mar 20', glyph: { Icon: Pisces, width: 40, height: 38 } },
];

/** Smaller constellation art used by the 60dp circles on the Horoscope tab */
export const SMALL_GLYPHS: Partial<Record<ZodiacKey, Glyph>> = {
  gemini: { Icon: GeminiSmall, width: 42, height: 29 },
  cancer: { Icon: CancerSmall, width: 41, height: 42 },
  taurus: { Icon: TaurusSmall, width: 42, height: 29 },
  aries: { Icon: AriesSmall, width: 42, height: 23 },
  libra: { Icon: LibraSmall, width: 33, height: 42 },
};

/**
 * Constellation art for the 60dp circles: the small variant when the design has one,
 * otherwise the large art scaled to fit the same 42dp box (so all 12 signs look alike).
 */
export function smallGlyph(key: ZodiacKey): Glyph {
  const small = SMALL_GLYPHS[key];
  if (small) return small;
  const big = ZODIAC_SIGNS.find(s => s.key === key)!.glyph;
  const k = 42 / Math.max(big.width, big.height);
  return { Icon: big.Icon, width: big.width * k, height: big.height * k };
}

type Element = 'fire' | 'earth' | 'air' | 'water';
const ELEMENT: Record<ZodiacKey, Element> = {
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
};
const COMPLEMENT: Record<Element, Element> = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };

/**
 * Classical element compatibility: the two other signs of the same element, then the
 * first two of the complementary element (fire-air, earth-water).
 */
export function compatibleSigns(key: ZodiacKey): ZodiacKey[] {
  const el = ELEMENT[key];
  const keys = ZODIAC_SIGNS.map(s => s.key);
  const same = keys.filter(k => k !== key && ELEMENT[k] === el);
  const comp = keys.filter(k => ELEMENT[k] === COMPLEMENT[el]).slice(0, 2);
  return [...same, ...comp];
}

export function findSign(key?: string): ZodiacSign | undefined {
  if (!key) return undefined;
  const k = key.toLowerCase();
  return ZODIAC_SIGNS.find(s => s.key === k || s.name.toLowerCase() === k);
}
