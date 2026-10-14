/**
 * Checks for the computed panchang sections (src/utils/ascendant.ts). Run from the repo root:
 *   npx tsx scripts/test-panchang-compute.ts            # offline checks (Divine spec examples)
 *   npx tsx scripts/test-panchang-compute.ts --divine   # + ascendant vs Divine planetary-positions (uses API quota)
 */
import assert from 'node:assert/strict';
import {
  NAKSHATRAS,
  SIGNS,
  formatLocal,
  goodChandrabalam,
  goodTarabalam,
  lagnaPeriods,
  nakshatraNumber,
  panchakaRahita,
  parseLocal,
  siderealAscendantDeg,
  signIndex,
  tithiNumber,
} from '../src/utils/ascendant';

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log(`ok - ${name}`);
};

// Divine find-chandrabalam-and-tarabalam example (2023-05-24, New Delhi)
test('chandrabalam: Moon in Gemini / Cancer', () => {
  assert.deepEqual(goodChandrabalam(signIndex('Gemini')), ['Aries', 'Gemini', 'Leo', 'Virgo', 'Sagittarius', 'Capricorn']);
  assert.deepEqual(goodChandrabalam(signIndex('Cancer')), ['Taurus', 'Cancer', 'Virgo', 'Libra', 'Capricorn', 'Aquarius']);
});

test('tarabalam: Moon in Punarvasu / Pushya', () => {
  const current = 'Bharani,Rohini,Ardhra,Pushya,Ashlesha,Purva Phalguni,Hasta,Swati,Anuradha,Jyeshtha,Purva Ashada,Shravan,Satabhisha,Uttara Bhadrapada,Revati';
  const next = 'Ashwini,Krittika,Mrigashira,Punarvasu,Ashlesha,Magha,Uttara Phalguni,Chitra,Vishakha,Jyeshtha,Moola,Uttara Ashada,Dhanishta,Purva Bhadrapada,Revati';
  assert.deepEqual(goodTarabalam(nakshatraNumber('Punarvasu')), current.split(','));
  assert.deepEqual(goodTarabalam(nakshatraNumber('Pushya')), next.split(','));
  // taras repeat every 9 nakshatras, so exactly the Punarvasu triad reproduces the example
  // (find-panchang for that date confirms the Moon is in Punarvasu)
  const matches = NAKSHATRAS.filter((_, i) => goodTarabalam(i + 1).join(',') === current);
  assert.deepEqual(matches, ['Punarvasu', 'Vishakha', 'Purva Bhadrapada']);
});

test('name -> number mapping', () => {
  NAKSHATRAS.forEach((nk, i) => assert.equal(nakshatraNumber(nk), i + 1));
  assert.equal(nakshatraNumber('Shatabhisha'), 24);
  assert.equal(nakshatraNumber('Mula'), 19);
  assert.equal(tithiNumber('5', 'Shukla'), 5);
  assert.equal(tithiNumber('5', 'Krishna'), 20);
  assert.equal(tithiNumber('15', 'Krishna', 'Amavasya'), 30);
  assert.equal(tithiNumber(undefined, undefined, 'Purnima'), 15);
});

// Divine uday-lagna example (2023-05-24, New Delhi, sunrise 05:25:56 -> 05:25:34)
const TZ = 5.5;
const LAT = 28.6139;
const LON = 77.209;
const from = parseLocal('2023-05-24 05:25:56', TZ)!;
const to = parseLocal('2023-05-25 05:25:34', TZ)!;
const lagnas = lagnaPeriods(from, to, LAT, LON);

test('udaya lagna matches the Divine example within 2 min', () => {
  const expected: Array<[string, string]> = [
    ['Taurus', '2023-05-24 05:25:56'],
    ['Gemini', '2023-05-24 06:55:56'],
    ['Cancer', '2023-05-24 09:10:56'],
    ['Leo', '2023-05-24 11:30:56'],
    ['Virgo', '2023-05-24 13:48:56'],
    ['Libra', '2023-05-24 16:04:56'],
    ['Scorpio', '2023-05-24 18:23:56'],
    ['Sagittarius', '2023-05-24 20:42:56'],
    ['Capricorn', '2023-05-24 22:46:56'],
    ['Aquarius', '2023-05-25 00:28:56'],
    ['Pisces', '2023-05-25 01:56:56'],
    ['Aries', '2023-05-25 03:21:56'],
    ['Taurus', '2023-05-25 04:56:56'],
  ];
  assert.equal(lagnas.length, expected.length);
  lagnas.forEach((l, i) => {
    assert.equal(SIGNS[l.signIndex], expected[i][0]);
    const diffMin = Math.abs(l.startMs - parseLocal(expected[i][1], TZ)!) / 60_000;
    assert.ok(diffMin <= 2, `${expected[i][0]} start off by ${diffMin.toFixed(1)} min (${formatLocal(l.startMs, TZ)})`);
  });
});

test('panchaka rahita matches the Divine example sequence', () => {
  // find-panchang 2023-05-24: Shukla Panchami until 2023-05-25 03:00:44, Punarvasu until 15:05:56; Wednesday (4)
  const periods = panchakaRahita(
    from,
    to,
    4,
    lagnas,
    [
      { value: 5, endMs: parseLocal('2023-05-25 03:00:44', TZ) },
      { value: 6, endMs: null },
    ],
    [
      { value: 7, endMs: parseLocal('2023-05-24 15:05:56', TZ) },
      { value: 8, endMs: null },
    ],
  );
  const expected =
    'Good,Mrityu,Agni,Good,Raja,Good,Chora,Good,Roga,Good,Mrityu,Agni,Good,Mrityu,Agni'.split(',').map((x) => `${x} Panchak`);
  assert.deepEqual(
    periods.map((p) => p.panchak),
    expected,
  );
});

async function vsDivine() {
  const { divineRequest } = await import('../src/lib/divine');
  const cases = [
    { place: 'New Delhi', day: 24, month: 5, year: 2023, hour: 6, min: 55, lat: 28.6139, lon: 77.209, tzone: 5.5 },
    { place: 'Mumbai', day: 15, month: 1, year: 1990, hour: 14, min: 30, lat: 19.076, lon: 72.8777, tzone: 5.5 },
    { place: 'London', day: 3, month: 11, year: 2026, hour: 22, min: 10, lat: 51.5074, lon: -0.1278, tzone: 0 },
    { place: 'Sydney', day: 21, month: 6, year: 2001, hour: 4, min: 5, lat: -33.8688, lon: 151.2093, tzone: 10 },
    { place: 'New York', day: 10, month: 8, year: 2015, hour: 9, min: 45, lat: 40.7128, lon: -74.006, tzone: -4 },
  ];
  const pad = (x: number) => String(x).padStart(2, '0');
  let worst = 0;
  for (const c of cases) {
    const d = (await divineRequest('planetaryPositions', {
      full_name: 'Test',
      day: pad(c.day),
      month: pad(c.month),
      year: String(c.year),
      hour: pad(c.hour),
      min: pad(c.min),
      sec: '00',
      gender: 'male',
      place: c.place,
      lat: String(c.lat),
      lon: String(c.lon),
      tzone: String(c.tzone),
    })) as { planets?: Array<{ name: string; full_degree: string }> };
    const asc = d.planets?.find((p) => p.name === 'Ascendant');
    const divineDeg = Number(asc?.full_degree);
    const utc = Date.UTC(c.year, c.month - 1, c.day, c.hour, c.min) - c.tzone * 3600_000;
    const mine = siderealAscendantDeg(utc, c.lat, c.lon);
    let delta = mine - divineDeg;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    worst = Math.max(worst, Math.abs(delta));
    console.log(`  ${c.place.padEnd(10)} divine ${divineDeg.toFixed(4)}  mine ${mine.toFixed(4)}  delta ${delta.toFixed(4)}°`);
  }
  assert.ok(worst < 0.3, `ascendant off by ${worst}°`);
  n++;
  console.log(`ok - ascendant vs Divine planetary-positions (max |delta| ${worst.toFixed(4)}°)`);
}

(async () => {
  if (process.argv.includes('--divine')) await vsDivine();
  console.log(`\n${n} checks passed`);
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
