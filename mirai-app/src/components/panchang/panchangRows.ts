import type { PanchangDate, PanchangSection } from '../../api/panchang';
import { formatClock } from '../../utils/astro';
import { humanize, toRows } from '../KeyValueList';

/** One table row: label on the left, one or more value lines on the right */
export type TableRow = { label: string; value: string };

type Obj = Record<string, unknown>;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const asObj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const asArr = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') as Obj[] : []);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const title = (s: string) => s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

/** Days between a "YYYY-MM-DD ..." timestamp and the selected day */
function dayOffset(stamp: string, date: PanchangDate): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(stamp);
  if (!m) return 0;
  const a = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const b = Date.UTC(date.year, date.month - 1, date.day);
  return Math.round((a - b) / 86_400_000);
}

/** "05:51:45 PM" (already 12-hour) or "17:51:45" -> "05:51 PM" */
function clock12(v: string): string {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)$/i.exec(v.trim());
  if (m) return `${m[1]!.padStart(2, '0')}:${m[2]} ${m[3]!.toUpperCase()}`;
  return formatClock(v);
}

/** "Jyeshtha till 10:41 AM", or for the last one (no end in the data) "Jyeshtha onwards" / "(full day)" */
function until(name: string, end: string, date: PanchangDate, only: boolean): string {
  if (end) return `${name} till ${clockOn(end, date)}`;
  return only ? `${name} (full day)` : `${name} onwards`;
}

/** "2026-10-16 03:25:39" -> "03:25 AM (+1 day)" relative to the selected day */
export function clockOn(stamp: string, date: PanchangDate): string {
  if (!stamp) return 'Ongoing';
  const t = formatClock(stamp);
  const d = dayOffset(stamp, date);
  if (d === 0) return t;
  return `${t} (${d > 0 ? '+' : ''}${d} day${Math.abs(d) > 1 ? 's' : ''})`;
}

/** Items that are running at some point of the selected day (start before its end, end after its start) */
function ofDay(items: Obj[], date: PanchangDate): Obj[] {
  return items.filter(it => {
    const start = str(it.start_time);
    const end = str(it.end_time);
    return (!start || dayOffset(start, date) <= 0) && (!end || dayOffset(end, date) >= 0);
  });
}

const weekday = (date: PanchangDate) => WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()]!;

const push = (rows: TableRow[], label: string, lines: string[]) => {
  const value = lines.filter(Boolean).join('\n');
  if (value) rows.push({ label, value });
};

/** "Jyeshtha" padas -> one entry per nakshatra ending with its last pada */
function nakshatraSpans(padas: Obj[]): { name: string; end: string }[] {
  const out: { name: string; end: string }[] = [];
  for (const p of padas) {
    const name = str(p.nak_name);
    if (!name) continue;
    const last = out[out.length - 1];
    if (last && last.name === name) last.end = str(p.end_time);
    else out.push({ name, end: str(p.end_time) });
  }
  return out;
}

function panchangRows(d: Obj, date: PanchangDate): TableRow[] {
  const rows: TableRow[] = [];
  push(rows, 'Vara (Weekday)', [weekday(date)]);
  push(
    rows,
    'Tithi',
    ofDay(asArr(d.tithis), date).map(
      t => `${str(t.tithi)}${str(t.paksha) ? ` (${str(t.paksha)} Paksha)` : ''} till ${clockOn(str(t.end_time), date)}`,
    ),
  );
  const nak = asObj(d.nakshatras);
  const spans = nakshatraSpans(asArr(nak.nakshatra_pada));
  const today = spans.filter(s => !s.end || dayOffset(s.end, date) >= 0);
  push(rows, 'Nakshatra', today.map(s => until(s.name, s.end, date, today.length === 1)));
  push(rows, 'Yoga', ofDay(asArr(d.yogas), date).map(y => `${str(y.yoga_name)} till ${clockOn(str(y.end_time), date)}`));
  push(rows, 'Karana', ofDay(asArr(d.karnas), date).map(k => `${str(k.karana_name)} till ${clockOn(str(k.end_time), date)}`));
  push(rows, 'Moon Sign', asArr(nak.zodiac_point).map(z => str(z.sign)));
  push(rows, 'Sun Sign', asArr(asObj(d.sun_nakshatras).zodiac_point).map(z => str(z.sign)));
  push(rows, 'Sunrise', [d.sunrise ? clockOn(str(d.sunrise), date) : '']);
  push(rows, 'Sunset', [d.sunset ? clockOn(str(d.sunset), date) : '']);
  return rows;
}

function sunMoonRows(d: Obj, date: PanchangDate): TableRow[] {
  const rows: TableRow[] = [];
  push(rows, 'Sunrise', [clock12(str(d.sunrise))]);
  push(rows, 'Sunset', [clock12(str(d.sunset))]);
  push(rows, 'Moonrise', [clock12(str(d.moonrise))]);
  push(rows, 'Moonset', [clock12(str(d.moonset))]);
  const vedic = str(d.weekday);
  push(rows, 'Vara (Weekday)', [`${weekday(date)}${vedic ? ` (${vedic})` : ''}`]);
  return rows;
}

function nakshatraRows(d: Obj, date: PanchangDate): TableRow[] {
  const rows: TableRow[] = [];
  const padas = asArr(asObj(d.nakshatras).nakshatra_pada).filter(p => !str(p.end_time) || dayOffset(str(p.end_time), date) >= 0);
  const spans = nakshatraSpans(padas);
  push(rows, 'Nakshatra', spans.map(s => until(s.name, s.end, date, spans.length === 1)));
  push(
    rows,
    'Pada',
    padas.map(p => until(`${str(p.nak_name)} Pada ${str(p.nak_pada)}`, str(p.end_time), date, false)),
  );
  // Traits of the nakshatra running at sunrise
  const first = padas[0] ?? {};
  const traits: [string, string][] = [
    ['lord', 'Lord'],
    ['deity', 'Deity'],
    ['gana', 'Gana'],
    ['guna', 'Guna'],
    ['element', 'Element'],
    ['symbol', 'Symbol'],
    ['syllables', 'Syllables'],
    ['direction', 'Direction'],
    ['color', 'Colour'],
    ['body_part', 'Body Part'],
    ['pursuit', 'Pursuit'],
  ];
  for (const [k, label] of traits) push(rows, label, [str(first[k])]);
  return rows;
}

/** {hours, minutes, seconds} -> "11h 29m 54s" */
function duration(v: unknown): string {
  const o = asObj(v);
  if (!('hours' in o)) return str(v);
  const p = (k: string) => String(Number(o[k] ?? 0)).padStart(2, '0');
  return `${Number(o.hours ?? 0)}h ${p('minutes')}m ${p('seconds')}s`;
}

function rituRows(d: Obj): TableRow[] {
  const rows: TableRow[] = [];
  const ritu = (r: Obj) => {
    const extra = [str(r.ayana), str(r.zodiac)].filter(Boolean).map(title).join(' / ');
    return `${title(str(r.name))}${extra ? ` (${extra})` : ''}`;
  };
  const ritus = asObj(d.ritus);
  push(rows, 'Drik Ritu (Ayana / Zodiac)', asArr(ritus.drik).map(ritu));
  push(rows, 'Vedic Ritu (Ayana / Zodiac)', asArr(ritus.vedic).map(ritu));
  push(rows, 'Dinmana (Day Length)', [duration(d.dinmana)]);
  push(rows, 'Raatrimana (Night Length)', [duration(d.raatrimana)]);
  push(rows, 'Madhyahna (Midday)', [str(d.madhyahna)]);
  return rows;
}

// Friendlier labels for vendor keys in the other sections
const LABELS: Record<string, string> = {
  rahu_kaal: 'Rahu Kaal',
  gulkai_kaal: 'Gulika Kaal',
  yamaganda: 'Yamaganda',
  dur_muhurtam: 'Dur Muhurtam',
  varjyam: 'Varjyam',
  baana: 'Baana',
  panchaka: 'Panchaka',
  brahma_muhurta: 'Brahma Muhurta',
  abhijit_muhurta: 'Abhijit Muhurta',
  vijay_muhurta: 'Vijay Muhurta',
  godhuli_muhurta: 'Godhuli Muhurta',
  pratah_sandhya: 'Pratah Sandhya (Morning Twilight)',
  sayahana_sandhya: 'Sayahna Sandhya (Evening Twilight)',
  nishita_muhurta: 'Nishita Muhurta',
  amrit_kalam: 'Amrit Kalam',
  sarvartha_siddhi_yoga: 'Sarvartha Siddhi Yoga',
  amrit_siddhi_yoga: 'Amrit Siddhi Yoga',
  siddha_yoga: 'Siddha Yoga',
  tri_pushkara_yoga: 'Tri Pushkara Yoga',
  ravi_yoga: 'Ravi Yoga',
  chandramasa: 'Chandramasa (Lunar Month)',
  adhik: 'Adhik Maas',
  type: 'Month System',
  vikram_name: 'Vikram Samvat Name',
  vikram_year: 'Vikram Samvat',
  shaka_name: 'Shaka Samvat Name',
  shaka_year: 'Shaka Samvat',
  disha_shool: 'Disha Shool',
  rahu_vaas: 'Rahu Vaas',
  shiva_vaas: 'Shiva Vaas',
  agni_vaas: 'Agni Vaas',
  yogini_vaas: 'Yogini Vaas',
  chandra_vaas: 'Chandra Vaas',
  homahuti: 'Homahuti',
  kumbha_chakra: 'Kumbha Chakra',
  kaliyuga: 'Kaliyuga',
  lahiri_ayanamsha: 'Lahiri Ayanamsha',
  julian_day: 'Julian Day',
  modified_julian_day: 'Modified Julian Day',
  julian_date: 'Julian Date',
  national_nirayana_date: 'National Nirayana Date',
  national_civil_date: 'National Civil Date',
  rata_die: 'Rata Die',
  kali_ahargana: 'Kali Ahargana',
};
// Repeated in most payloads and already shown in the Sunrise & Moonrise section
const SKIP = new Set(['date', 'sunrise', 'sunset']);

const isRange = (v: unknown): v is Obj => !!v && typeof v === 'object' && 'start_time' in (v as Obj);

/** Any other vendor payload: one row per key; time ranges become "start - end" lines */
function genericRows(d: Obj, date: PanchangDate): TableRow[] {
  const rows: TableRow[] = [];
  for (const [k, v] of Object.entries(d)) {
    if (SKIP.has(k)) continue;
    const label = LABELS[k] ?? humanize(k);
    const ranges = (Array.isArray(v) ? v : [v]).filter(isRange);
    if (ranges.length) {
      push(
        rows,
        label,
        ranges.map(r => {
          const name = str(r.sign) || str(r.name);
          const span = `${clockOn(str(r.start_time), date)} - ${clockOn(str(r.end_time), date)}`;
          return name ? `${name}: ${span}` : span;
        }),
      );
      continue;
    }
    if (Array.isArray(v) && v.every(x => typeof x === 'string' || typeof x === 'number')) {
      push(rows, label, v.map(x => str(x)));
      continue;
    }
    if (v === 'true' || v === 'false' || typeof v === 'boolean') {
      push(rows, label, [String(v) === 'true' ? 'Yes' : 'No']);
      continue;
    }
    // Strings, numbers and anything nested: the shared flattener keeps its formatting
    for (const r of toRows({ [k]: v })) push(rows, r.label === humanize(k) ? label : r.label, [r.value]);
  }
  return rows;
}

/** Table rows for a Panchang detail section */
export function sectionRows(section: PanchangSection, data: unknown, date: PanchangDate): TableRow[] {
  const d = asObj(data);
  switch (section) {
    case '':
      return panchangRows(d, date);
    case 'sun-and-moon':
      return sunMoonRows(d, date);
    case 'ritu-ayana':
      return rituRows(d);
    case 'rashi-nakshatra':
      return nakshatraRows(d, date);
    default:
      return genericRows(d, date);
  }
}
