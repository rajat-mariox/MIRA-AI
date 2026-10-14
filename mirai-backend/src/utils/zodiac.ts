export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export function isZodiacSign(v: unknown): v is ZodiacSign {
  return typeof v === 'string' && (ZODIAC_SIGNS as readonly string[]).includes(v.toLowerCase());
}

/** [month (1-12), day] on which each sign STARTS (tropical / western sun sign). */
const STARTS: Array<[number, number, ZodiacSign]> = [
  [1, 20, 'aquarius'],
  [2, 19, 'pisces'],
  [3, 21, 'aries'],
  [4, 20, 'taurus'],
  [5, 21, 'gemini'],
  [6, 21, 'cancer'],
  [7, 23, 'leo'],
  [8, 23, 'virgo'],
  [9, 23, 'libra'],
  [10, 23, 'scorpio'],
  [11, 22, 'sagittarius'],
  [12, 22, 'capricorn'],
];

/**
 * Western (tropical) sun sign for a date of birth. Uses UTC month/day, since
 * dateOfBirth is stored as midnight UTC ("1995-06-15T00:00:00.000Z").
 */
export function getSunSign(date: Date): ZodiacSign {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  let sign: ZodiacSign = 'capricorn'; // Jan 1 - Jan 19
  for (const [m, d, s] of STARTS) {
    if (month > m || (month === m && day >= d)) sign = s;
  }
  return sign;
}

// ─── Naam rashi (Vedic name-syllable sign) ────────────────────────────────────

type Vowel = 'a' | 'i' | 'u' | 'e' | 'o';
type SignRow = Partial<Record<Vowel, ZodiacSign>> & { default: ZodiacSign };

/**
 * First consonant (aspirate digraphs kept together) → sign, per vowel where it matters, from the
 * traditional naam akshar table (e.g. Tula: रा री रू रे रो ता ती तू ते). Where Latin spelling can't
 * tell two Hindi letters apart (t: ट/त, d: ड/द, th: ठ/थ) the far more common dental one is used.
 */
const LATIN_SIGNS: Record<string, SignRow> = {
  l: { default: 'aries' },
  ch: { a: 'pisces', i: 'pisces', default: 'aries' },
  chh: { default: 'gemini' },
  v: { default: 'taurus' },
  w: { default: 'taurus' },
  b: { default: 'taurus' },
  k: { default: 'gemini' },
  q: { default: 'gemini' },
  c: { default: 'gemini' },
  gh: { default: 'gemini' },
  kh: { default: 'capricorn' },
  h: { a: 'gemini', default: 'cancer' },
  m: { default: 'leo' },
  p: { default: 'virgo' },
  sh: { default: 'virgo' },
  r: { default: 'libra' },
  t: { o: 'scorpio', default: 'libra' },
  n: { default: 'scorpio' },
  y: { e: 'sagittarius', o: 'sagittarius', default: 'scorpio' },
  bh: { o: 'capricorn', default: 'sagittarius' },
  dh: { default: 'sagittarius' },
  ph: { default: 'sagittarius' },
  f: { default: 'sagittarius' },
  j: { default: 'capricorn' },
  z: { default: 'capricorn' },
  g: { a: 'capricorn', i: 'capricorn', default: 'aquarius' },
  s: { default: 'aquarius' },
  d: { a: 'aquarius', default: 'pisces' },
  th: { default: 'pisces' },
  jh: { default: 'pisces' },
};

const LATIN_DIGRAPHS = ['chh', 'bh', 'ch', 'dh', 'gh', 'jh', 'kh', 'ph', 'sh', 'th'];

/** Devanagari first letter → sign; vowels and consonants of the naam akshar table */
const DEVANAGARI_SIGNS: Record<string, SignRow> = {
  अ: { default: 'aries' },
  आ: { default: 'aries' },
  इ: { default: 'taurus' },
  ई: { default: 'taurus' },
  उ: { default: 'taurus' },
  ऊ: { default: 'taurus' },
  ए: { default: 'taurus' },
  ऐ: { default: 'taurus' },
  ओ: { default: 'taurus' },
  औ: { default: 'taurus' },
  ल: { default: 'aries' },
  च: { a: 'pisces', i: 'pisces', default: 'aries' },
  छ: { default: 'gemini' },
  व: { default: 'taurus' },
  ब: { default: 'taurus' },
  क: { default: 'gemini' },
  घ: { default: 'gemini' },
  ख: { default: 'capricorn' },
  ह: { a: 'gemini', default: 'cancer' },
  ड: { default: 'cancer' },
  म: { default: 'leo' },
  ट: { o: 'virgo', default: 'leo' },
  प: { default: 'virgo' },
  ष: { default: 'virgo' },
  श: { default: 'virgo' },
  ण: { default: 'virgo' },
  ठ: { default: 'virgo' },
  र: { default: 'libra' },
  त: { o: 'scorpio', default: 'libra' },
  न: { default: 'scorpio' },
  य: { e: 'sagittarius', o: 'sagittarius', default: 'scorpio' },
  भ: { o: 'capricorn', default: 'sagittarius' },
  ध: { default: 'sagittarius' },
  फ: { default: 'sagittarius' },
  ढ: { default: 'sagittarius' },
  ज: { default: 'capricorn' },
  ग: { a: 'capricorn', i: 'capricorn', default: 'aquarius' },
  स: { default: 'aquarius' },
  द: { a: 'aquarius', default: 'pisces' },
  थ: { default: 'pisces' },
  झ: { default: 'pisces' },
};

const DEVANAGARI_MATRAS: Record<string, Vowel> = {
  'ा': 'a',
  'ि': 'i',
  'ी': 'i',
  'ु': 'u',
  'ू': 'u',
  'े': 'e',
  'ै': 'e',
  'ो': 'o',
  'ौ': 'o',
};

/** Vowel sound at the start of a Latin string (ee → i, oo → u, ai → e, au → o) */
function latinVowel(s: string): Vowel | null {
  if (s.startsWith('ai') || s.startsWith('ay')) return 'e';
  if (s.startsWith('au') || s.startsWith('aw')) return 'o';
  if (s.startsWith('ee') || s.startsWith('ea')) return 'i';
  if (s.startsWith('oo')) return 'u';
  const c = s[0];
  return c === 'a' || c === 'i' || c === 'u' || c === 'e' || c === 'o' ? c : null;
}

const pick = (row: SignRow, v: Vowel | null) => (v && row[v]) || row.default;

/**
 * Naam rashi: the sign of the first syllable of the first name, per the traditional Vedic
 * naam akshar table ("Rajat" → रा → Tula/libra). Null when the name can't be read.
 */
export function getNameRashi(fullName: string | null | undefined): ZodiacSign | null {
  const first = (fullName ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return null;

  const devanagari = DEVANAGARI_SIGNS[first[0]];
  if (devanagari) {
    // A consonant without a matra (or in a conjunct) carries the inherent 'a'
    return pick(devanagari, DEVANAGARI_MATRAS[first[1] ?? ''] ?? 'a');
  }

  const name = first.toLowerCase().replace(/[^a-z]/g, '');
  if (!name) return null;

  // Starting with a vowel: अ/आ → Mesh, any other vowel → Vrishabh
  const lead = latinVowel(name);
  if (lead) return lead === 'a' ? 'aries' : 'taurus';

  const consonant = LATIN_DIGRAPHS.find(d => name.startsWith(d)) ?? name[0];
  const row = LATIN_SIGNS[consonant];
  if (!row) return null;

  // Vowel of the first syllable, skipping a conjunct's extra consonants (Priya → i, Krishna → i)
  const rest = name.slice(consonant.length);
  const at = rest.search(/[aeiou]/);
  return pick(row, at === -1 ? null : latinVowel(rest.slice(at)));
}

/** The user's rashi: from their name first, else the sun sign of their date of birth */
export function getUserRashi(
  fullName: string | null | undefined,
  dateOfBirth: Date | string | null | undefined,
): ZodiacSign | null {
  const fromName = getNameRashi(fullName);
  if (fromName) return fromName;
  const dob = dateOfBirth ? new Date(dateOfBirth) : null;
  return dob && !Number.isNaN(dob.getTime()) ? getSunSign(dob) : null;
}
