/**
 * Sanity checks for the Divine response normalisers, using the sample responses from the
 * Divine API reference. Run from the repo root:  npx tsx scripts/test-divine-normalizers.ts
 */
import assert from 'node:assert/strict';
import { normalizeHoroscope } from '../src/modules/horoscope/horoscope.normalize';
import { normalizeChart } from '../src/modules/kundli/kundli.service';
import {
  filterFestivalsByMonth,
  mergeLunarSamvat,
  normalizeNivasShool,
  summarizeAuspicious,
} from '../src/modules/panchang/panchang.normalize';
import { toTimeRanges } from '../src/lib/divine';

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok - ${name}`);
};

const cats = { personal: 'p', health: 'h', profession: 'pr', emotions: 'e', travel: 't' };
const special = {
  lucky_color_codes: ['#DAA520', '#008080'],
  horoscope_percentage: { personal: 74, health: 68, profession: 77, emotions: 71, travel: 80, luck: 75 },
};

test('daily horoscope (prediction key)', () => {
  const r = normalizeHoroscope({
    sign: 'Aries',
    date: '2026-04-11',
    prediction: { ...cats, luck: ['Colors of the day : Goldenrod, Teal', 'Lucky Numbers of the day : 3, 5, 8'] },
    special,
  });
  assert.equal(r.prediction.personal, 'p');
  assert.deepEqual(r.prediction.luck, ['Colors of the day : Goldenrod, Teal', 'Lucky Numbers of the day : 3, 5, 8']);
  assert.deepEqual(r.special?.lucky_color_codes, ['#DAA520', '#008080']);
  assert.equal(r.special?.horoscope_percentage.luck, 75);
});

test('weekly / monthly / yearly keys map to prediction', () => {
  for (const key of ['weekly_horoscope', 'monthly_horoscope', 'yearly_horoscope']) {
    const r = normalizeHoroscope({ sign: 'Aries', [key]: { ...cats, luck: ['Colors of the week : Crimson'] }, special });
    assert.equal(r.prediction.travel, 't', key);
    assert.deepEqual(r.prediction.luck, ['Colors of the week : Crimson']);
  }
});

test('horoscope without special / garbage input', () => {
  const r = normalizeHoroscope({ prediction: { personal: 'x' } });
  assert.equal(r.special, undefined);
  assert.equal(r.prediction.health, '');
  assert.deepEqual(r.prediction.luck, []);
  assert.deepEqual(normalizeHoroscope(null).prediction.luck, []);
});

test('auspicious timings summary ([] vs object vs array)', () => {
  const s = summarizeAuspicious({
    date: '2023-05-24',
    sunrise: '2023-05-24 05:25:56',
    sunset: '2023-05-24 19:09:54',
    brahma_muhurta: { start_time: '2023-05-24 04:03:48', end_time: '2023-05-24 04:44:52' },
    abhijit_muhurta: [],
    ravi_yoga: [{ start_time: '2023-05-24 15:06:44', end_time: '2023-05-25 05:25:34' }],
    amrit_kalam: { start_time: '2023-05-24 12:27:02', end_time: '2023-05-24 14:12:50' },
  });
  assert.equal(s.abhijitMuhurta, null);
  assert.deepEqual(s.brahmaMuhurta, { start: '2023-05-24 04:03:48', end: '2023-05-24 04:44:52' });
  assert.equal(s.amritKalam?.end, '2023-05-24 14:12:50');
  assert.equal(s.vijayMuhurta, null);
  assert.equal(toTimeRanges([{ start_time: 'a', end_time: 'b' }]).length, 1);
});

test('festivals filtered by month (3 shapes)', () => {
  const raw = {
    kalabhairav_jayanti: { date: '2023-12-05', image: 'x' },
    utpanna_ekadashi: { smartas: { date: '2023-12-08', parana: { start_time: 'a', end_time: 'b' } }, vaishnavas: { date: '2023-12-08' } },
    pradosha_vrat: [{ date: '2023-12-10', name: 'Ravi Pradosha Vrat' }],
    out_of_month: { date: '2023-01-04' },
  };
  const f = filterFestivalsByMonth(raw, 2023, 12);
  assert.deepEqual(Object.keys(f), ['kalabhairav_jayanti', 'utpanna_ekadashi', 'pradosha_vrat']);
});

test('nivas & shool trimmed', () => {
  const r = normalizeNivasShool({ disha_shool: 'North', shiva_vaas: ['Crematorium '], yogini_vaas: ['East '] });
  assert.deepEqual(r.shiva_vaas, ['Crematorium']);
  assert.deepEqual(r.yogini_vaas, ['East']);
});

test('lunar month + samvat merged', () => {
  const r = mergeLunarSamvat(
    { date: '2023-05-24', chandramasa: 'Jyeshtha', adhik: 'false', type: 'Amanta' },
    { vikram_name: 'Nala/anala', shaka_name: 'Sobhakrta', shaka_year: 1945, vikram_year: 2080 },
  );
  assert.equal(r.chandramasa, 'Jyeshtha');
  assert.equal(r.vikram_year, 2080);
});

test('chart normalised (svg + houses)', () => {
  const c = normalizeChart(
    { svg: '<svg></svg>', data: { '1': { sign_no: 6, planet: [] } }, base64_image: 'data:image/svg+xml;base64,AA' },
    'D1',
    'north',
  );
  assert.equal(c.svg, '<svg></svg>');
  assert.deepEqual(Object.keys(c.houses), ['1']);
  assert.equal(c.base64Image, 'data:image/svg+xml;base64,AA');
});

console.log(`\n${n} normaliser tests passed`);
process.exit(0);
