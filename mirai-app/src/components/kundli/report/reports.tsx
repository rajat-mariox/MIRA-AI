import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import GlassCard from '../../GlassCard';
import KundliChart from '../KundliChart';
import { humanize } from '../../KeyValueList';
import { ErrorCard, InfoCard, LoadingView } from '../../StateViews';
import useApi from '../../../hooks/useApi';
import {
  getAscendantReport,
  getChart,
  getKaalSarpa,
  getManglik,
  getPlanetaryPositions,
  getSadheSati,
  getVimshottari,
  isKundliIncomplete,
  type ChartData,
  type ChartId,
  type KundliObject,
  type KundliOverrides,
  type KundliResult,
} from '../../../api/kundli';
import type { RootStackParamList } from '../../../navigation/types';
import { ZODIAC_SIGNS } from '../../horoscope/zodiac';
import PlanetsIcon from '../../../assets/images/kundli-planets.svg';
import DashaIcon from '../../../assets/images/kundli-dasha.svg';
import MangalDoshaIcon from '../../../assets/images/kundli-mangal-dosha.svg';
import KaalsarpaDoshaIcon from '../../../assets/images/kundli-kaalsarpa-dosha.svg';
import SadeSatiIcon from '../../../assets/images/kundli-sade-sati.svg';
import DivisionalChartsIcon from '../../../assets/images/kundli-divisional-charts.svg';
import ChevronRight from '../../../assets/images/icon-chevron-right.svg';
import {
  AnalysisSection,
  CARD_ANGLE,
  cleanFacts,
  Emblem,
  FactsCard,
  PillTabs,
  ReportHero,
  ReportSection,
  SectionLabel,
} from './ReportBlocks';
import { colors, fonts, MONTHS } from '../../../theme';

export type KundliReportType = 'planets' | 'dasha' | 'asc' | 'mangal' | 'kaalsarpa' | 'sadesati' | 'divisional';

export const REPORT_TITLES: Record<KundliReportType, string> = {
  planets: 'Planets Report',
  dasha: 'Dasha Report',
  asc: 'Ascendant Report',
  mangal: 'Mangal Dosha Report',
  kaalsarpa: 'Kaal Sarpa Report',
  sadesati: 'Sade Sati Report',
  divisional: 'Divisional Charts',
};

/** Whose kundli: `name` set = a saved profile of someone else, otherwise the user's own. */
export type ReportProps = { overrides?: KundliOverrides; name?: string };

type Obj = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strings = (v: unknown): string[] =>
  arr(v)
    .map(x => (typeof x === 'string' ? x : typeof x === 'object' && x ? Object.values(x as Obj).map(str).join(' ') : str(x)))
    .map(s => s.trim())
    .filter(Boolean);
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const caps = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const possessive = (name?: string) => (name ? `${name}'s` : 'Your');

/** "2025-11-07" / "2025-11-07 04:35:00" -> "7 Nov 2025" */
function fmtDate(v: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(v));
  if (!m) return '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1].slice(0, 3)} ${m[1]}`;
}
const range = (a: unknown, b: unknown) => {
  const s = fmtDate(a);
  const e = fmtDate(b);
  return s && e ? `${s} – ${e}` : s || e;
};
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------- data loading ----------

type Loaded<T> = { ok: true; data: T } | { ok: false; missing: string[] };

async function load<T>(p: Promise<KundliResult<T>>): Promise<Loaded<T>> {
  const r = await p;
  return isKundliIncomplete(r) ? { ok: false, missing: r.missingFields } : { ok: true, data: r as T };
}

/** Spinner / error / profile-incomplete states around a report body. */
function Gate<T>({
  state,
  children,
}: {
  state: { data?: Loaded<T>; loading: boolean; error: unknown; reload: () => void };
  children: (data: T) => React.ReactNode;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (state.loading && !state.data) return <LoadingView size="large" style={styles.loading} />;
  if (state.error) return <ErrorCard error={state.error} onRetry={state.reload} />;
  if (!state.data) return null;
  if (!state.data.ok) {
    return (
      <InfoCard
        title="Complete your birth details"
        message={`Your kundli needs: ${state.data.missing.map(humanize).join(', ')}.`}
        action={{ label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') }}
      />
    );
  }
  return <>{children(state.data.data)}</>;
}

// ---------- shared list card ----------

type ListRow = {
  key: string;
  title: string;
  subtitle?: string;
  right?: string;
  badge?: string;
  highlight?: boolean;
  onPress?: () => void;
};

function ListCard({ rows }: { rows: ListRow[] }) {
  if (rows.length === 0) return null;
  return (
    <GlassCard angle={CARD_ANGLE} style={styles.listCard}>
      {rows.map((r, i) => (
        <Pressable
          key={r.key}
          onPress={r.onPress}
          disabled={!r.onPress}
          accessibilityRole={r.onPress ? 'button' : undefined}
          style={({ pressed }) => [
            styles.listRow,
            i > 0 && styles.listDivider,
            r.highlight && styles.listRowHighlight,
            pressed && styles.listRowPressed,
          ]}
        >
          <View style={styles.listMain}>
            <View style={styles.listTitleRow}>
              <Text style={[styles.listTitle, r.highlight && styles.listTitleHighlight]} numberOfLines={1}>
                {r.title}
              </Text>
              {!!r.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{r.badge}</Text>
                </View>
              )}
            </View>
            {!!r.subtitle && <Text style={styles.listSubtitle}>{r.subtitle}</Text>}
          </View>
          {!!r.right && <Text style={styles.listRight}>{r.right}</Text>}
          {!!r.onPress && <ChevronRight width={18} height={18} style={styles.chevron} />}
        </Pressable>
      ))}
    </GlassCard>
  );
}

// ---------- Ascendant ----------

export function AscendantReport({ overrides, name }: ReportProps) {
  const state = useApi(() => load(getAscendantReport(overrides)), [overrides?.profileId]);
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const asc = str(d.ascendant);
        const analysis = obj(d.analysis);
        return (
          <>
            <ReportHero
              emblem={<Emblem sign={asc} />}
              title={asc || 'Ascendant'}
              subtitle={`${possessive(name)} Ascendant / Lagna`}
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  { label: 'Planetary lord', value: str(d.planetary_lord) },
                  { label: 'Symbol', value: str(d.symble ?? d.symbol) },
                  { label: 'Characteristics', value: str(d.characteristics), full: true },
                  { label: 'Day of fast', value: str(d.day_of_fast) },
                  {
                    label: 'Lucky stones',
                    value: strings(d.lucky_stone)
                      .flatMap(s => s.split(','))
                      .map(s => s.trim())
                      .filter(Boolean)
                      .join(', '),
                    full: true,
                  },
                ])}
              />
            </ReportSection>
            <AnalysisSection
              tabs={Object.entries(analysis).map(([k, v]) => ({
                id: k,
                label: humanize(k),
                heading: `${humanize(k)} analysis`,
                paragraphs: [str(v)],
              }))}
            />
          </>
        );
      }}
    </Gate>
  );
}

// ---------- Planets ----------

const CLASSICAL = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];

/** "4:3:0" (deg:min:sec within the sign) -> 4°03'00" */
function dmsText(v: unknown): string {
  const parts = str(v).split(':').map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const p2 = (n: number) => String(n).padStart(2, '0');
    return `${parts[0]}°${p2(parts[1])}'${p2(parts[2])}"`;
  }
  return str(v);
}
const isTrue = (v: unknown) => ['true', '1', 'yes'].includes(str(v).toLowerCase());
const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export function PlanetsReport({ overrides, name }: ReportProps) {
  const state = useApi(() => load(getPlanetaryPositions(overrides)), [overrides?.profileId]);
  const [planet, setPlanet] = useState<string>('');
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const list = arr(d.planets).map(obj);
        const byName = (n: string) => list.find(p => str(p.name).toLowerCase() === n);
        const asc = byName('ascendant');
        const planets = list.filter(p => str(p.name).toLowerCase() !== 'ascendant');
        const classical = planets.filter(p => CLASSICAL.includes(str(p.name).toLowerCase()));
        const names = (f: (p: Obj) => boolean) => classical.filter(f).map(p => str(p.name_lan || p.name)).join(', ');
        const retro = names(p => isTrue(p.is_retro));
        const combust = names(p => isTrue(p.is_combusted));
        const selected = planets.find(p => str(p.name) === planet) ?? planets[0];

        return (
          <>
            <ReportHero
              emblem={<Emblem Icon={PlanetsIcon} />}
              title={`${classical.length || planets.length} Planets`}
              subtitle={`${possessive(name)} planetary positions at birth`}
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  asc && { label: 'Ascendant', value: `${str(asc.sign)}${asc.longitude ? ` ${dmsText(asc.longitude)}` : ''}` },
                  asc && { label: 'Lagna lord', value: str(asc.rashi_lord) },
                  { label: 'Sun sign', value: str(byName('sun')?.sign) },
                  { label: 'Moon sign', value: str(byName('moon')?.sign) },
                  { label: 'Moon nakshatra', value: str(byName('moon')?.nakshatra), full: true },
                  { label: 'Retrograde', value: retro || 'None', full: true },
                  { label: 'Combust', value: combust || 'None', full: true },
                ])}
              />
            </ReportSection>
            <ReportSection title="Planet positions">
              <ListCard
                rows={planets.map(p => ({
                  key: str(p.name),
                  title: str(p.name_lan || p.name),
                  badge: isTrue(p.is_retro) ? 'R' : undefined,
                  subtitle: [
                    str(p.sign),
                    p.house ? `${ordinal(Number(p.house))} house` : '',
                    str(p.nakshatra) ? `${str(p.nakshatra)}${p.nakshatra_pada ? ` (${str(p.nakshatra_pada)})` : ''}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · '),
                  right: dmsText(p.longitude),
                }))}
              />
            </ReportSection>
            {selected && (
              <ReportSection title="Planet details">
                <PillTabs
                  items={planets.map(p => ({ id: str(p.name), label: str(p.name_lan || p.name) }))}
                  selected={str(selected.name)}
                  onSelect={setPlanet}
                  style={styles.bleed}
                />
                <FactsCard
                  facts={cleanFacts([
                    { label: 'Sign', value: str(selected.sign) },
                    { label: 'House', value: selected.house ? ordinal(Number(selected.house)) : '' },
                    { label: 'Degree', value: dmsText(selected.longitude) },
                    { label: 'Sign lord', value: str(selected.rashi_lord) },
                    {
                      label: 'Nakshatra',
                      value: `${str(selected.nakshatra)}${selected.nakshatra_pada ? ` (pada ${str(selected.nakshatra_pada)})` : ''}`,
                    },
                    { label: 'Nakshatra lord', value: str(selected.nakshatra_lord) },
                    { label: 'Sub lord', value: str(selected.sub_lord) },
                    { label: 'Awastha', value: str(selected.awastha) },
                    { label: 'Karaka', value: str(selected.karakamsha) },
                    { label: 'Nature', value: caps(str(selected.type)) },
                    { label: 'Retrograde', value: isTrue(selected.is_retro) ? 'Yes' : 'No' },
                    { label: 'Combust', value: isTrue(selected.is_combusted) ? 'Yes' : 'No' },
                    { label: 'Lord of', value: str(selected.lord_of), full: true },
                  ])}
                />
              </ReportSection>
            )}
          </>
        );
      }}
    </Gate>
  );
}

// ---------- Dasha ----------

type Period = { planet: string; start: string; end: string };

function periods(o: Obj, startKey: string, endKey: string): Period[] {
  return Object.entries(o).map(([planet, v]) => {
    const p = obj(v);
    return { planet, start: str(p[startKey]), end: str(p[endKey]) };
  });
}
const isCurrent = (p: Period, today: string) => /^\d{4}/.test(p.start) && p.start <= today && today < p.end;

export function DashaReport({ overrides, name }: ReportProps) {
  // antar-dasha includes every mahadasha with its antardashas
  const state = useApi(() => load(getVimshottari(overrides, 'antar-dasha')), [overrides?.profileId]);
  const [tab, setTab] = useState<'maha' | 'antar'>('maha');
  const [maha, setMaha] = useState<string>('');
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const today = todayIso();
        const mahaObj = obj(d.maha_dasha);
        const mahas = periods(mahaObj, 'start_date', 'end_date');
        const current = mahas.find(p => isCurrent(p, today));
        const antarsOf = (planet: string) => periods(obj(obj(mahaObj[planet]).antar_dasha), 'start_time', 'end_time');
        const currentAntar = current ? antarsOf(current.planet).find(p => isCurrent(p, today)) : undefined;
        const next = current ? mahas[mahas.indexOf(current) + 1] : undefined;
        const shownMaha = maha || current?.planet || mahas[0]?.planet || '';
        const antars = shownMaha ? antarsOf(shownMaha) : [];

        return (
          <>
            <ReportHero
              emblem={<Emblem Icon={DashaIcon} />}
              title={current ? `${current.planet} Mahadasha` : 'Vimshottari Dasha'}
              subtitle={
                current
                  ? `${possessive(name)} current period · ${range(current.start, current.end)}`
                  : `${possessive(name)} Vimshottari dasha periods`
              }
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  current && { label: 'Mahadasha', value: current.planet },
                  currentAntar && { label: 'Antardasha', value: currentAntar.planet },
                  current && { label: 'Mahadasha period', value: range(current.start, current.end), full: true },
                  currentAntar && { label: 'Antardasha period', value: range(currentAntar.start, currentAntar.end), full: true },
                  next && { label: 'Next mahadasha', value: next.planet },
                  next && { label: 'Starts', value: fmtDate(next.start) },
                  mahas[0] && { label: 'Dasha at birth', value: mahas[0].planet },
                  { label: 'Birth date', value: fmtDate(d.date) },
                ])}
              />
            </ReportSection>
            <ReportSection title="Dasha timeline">
              <PillTabs
                items={[
                  { id: 'maha' as const, label: 'Mahadasha' },
                  { id: 'antar' as const, label: shownMaha ? `${shownMaha} Antardasha` : 'Antardasha' },
                ]}
                selected={tab}
                onSelect={setTab}
                style={styles.bleed}
              />
              {tab === 'maha' ? (
                <>
                  <ListCard
                    rows={mahas.map(p => ({
                      key: p.planet,
                      title: p.planet,
                      subtitle: range(p.start, p.end),
                      badge: p === current ? 'NOW' : undefined,
                      highlight: p === current,
                      onPress: () => {
                        setMaha(p.planet);
                        setTab('antar');
                      },
                    }))}
                  />
                  <Text style={styles.hint}>Tap a mahadasha to see its antardashas.</Text>
                </>
              ) : (
                <ListCard
                  rows={antars.map(p => ({
                    key: p.planet,
                    title: `${shownMaha} / ${p.planet}`,
                    subtitle: range(p.start, p.end) || 'Before birth',
                    badge: isCurrent(p, today) ? 'NOW' : undefined,
                    highlight: isCurrent(p, today),
                  }))}
                />
              )}
            </ReportSection>
          </>
        );
      }}
    </Gate>
  );
}

// ---------- Doshas ----------

export function ManglikReport({ overrides, name }: ReportProps) {
  const state = useApi(() => load(getManglik(overrides)), [overrides?.profileId]);
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const present = d.isPresent === true;
        const pct = d.percentage === undefined || d.percentage === null ? '' : `${str(d.percentage)}%`;
        return (
          <>
            <ReportHero
              emblem={<Emblem Icon={MangalDoshaIcon} iconAspect={18.3334 / 22.5322} />}
              title="Mangal Dosha"
              subtitle={`${possessive(name)} Manglik status`}
              status={{ label: present ? 'Present' : 'Absent', tone: present ? 'bad' : 'good' }}
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  { label: 'Manglik', value: str(d.manglik_dosha) },
                  { label: 'Strength', value: str(d.strength) },
                  { label: 'Percentage', value: pct },
                ])}
              />
            </ReportSection>
            <AnalysisSection
              tabs={[
                { id: 'analysis', label: 'Analysis', paragraphs: strings(d.comment) },
                { id: 'remedies', label: 'Remedies', bullets: strings(d.remedies) },
              ]}
            />
          </>
        );
      }}
    </Gate>
  );
}

export function KaalSarpaReport({ overrides, name }: ReportProps) {
  const state = useApi(() => load(getKaalSarpa(overrides)), [overrides?.profileId]);
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const present = d.isPresent === true;
        return (
          <>
            <ReportHero
              emblem={<Emblem Icon={KaalsarpaDoshaIcon} />}
              title="Kaal Sarpa Dosha"
              subtitle={`${possessive(name)} Kaal Sarpa yoga status`}
              status={{ label: present ? 'Present' : 'Absent', tone: present ? 'bad' : 'good' }}
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  { label: 'Kaal Sarpa', value: present ? 'Yes' : 'No' },
                  { label: 'Type', value: str(d.name) },
                  { label: 'Intensity', value: caps(str(d.intensity)) },
                  { label: 'Direction', value: caps(str(d.direction)) },
                ])}
              />
            </ReportSection>
            <AnalysisSection tabs={[{ id: 'remedies', label: 'Remedies', bullets: strings(d.remedies) }]} />
          </>
        );
      }}
    </Gate>
  );
}

export function SadeSatiReport({ overrides, name }: ReportProps) {
  const state = useApi(() => load(getSadheSati(overrides)), [overrides?.profileId]);
  return (
    <Gate state={state}>
      {(d: KundliObject) => {
        const cur = obj(d.sadhesati_current_phase);
        const phase = str(cur.current_phase);
        const present = !!phase && !/^no\b/i.test(phase);
        const content = obj(d.content);
        const life = arr(d.sadhesati_life_analysis).map(obj);
        const panoti = arr(d.small_panoti).map(obj);
        const today = todayIso();
        const phaseRow = (p: Obj, i: number, withPhase: boolean) => {
          const start = str(p.start_date);
          const end = str(p.end_date);
          const now = start.slice(0, 10) <= today && today < end.slice(0, 10);
          return {
            key: `${i}`,
            title: withPhase ? `${caps(str(p.phase).toLowerCase())} · ${str(p.sign_name)}` : str(p.sign_name),
            subtitle: range(start, end),
            badge: now ? 'NOW' : undefined,
            highlight: now,
          };
        };
        return (
          <>
            <ReportHero
              emblem={<Emblem Icon={SadeSatiIcon} iconAspect={22 / 15.4383} />}
              title="Sade Sati"
              subtitle={`${possessive(name)} Saturn transit over the Moon`}
              status={{ label: present ? 'Present' : 'Absent', tone: present ? 'bad' : 'good' }}
            />
            <ReportSection title="Quick facts">
              <FactsCard
                facts={cleanFacts([
                  { label: 'Moon sign', value: str(d.moon_sign) },
                  { label: 'Current phase', value: caps(phase.toLowerCase()) },
                  present && { label: 'Current period', value: range(cur.current_start_date, cur.current_end_date), full: true },
                  { label: 'Next phase', value: caps(str(cur.next_phase).toLowerCase()) },
                  { label: 'Next starts', value: fmtDate(cur.next_start_date) },
                  { label: 'Next period', value: range(cur.next_start_date, cur.next_end_date), full: true },
                ])}
              />
            </ReportSection>
            <AnalysisSection
              tabs={[
                {
                  id: 'about',
                  label: 'About',
                  heading: str(content.title) || 'About',
                  paragraphs: strings(content.description),
                },
                { id: 'remedies', label: 'Remedies', bullets: strings(d.remedies) },
                {
                  id: 'life',
                  label: 'Life timeline',
                  heading: 'Sade Sati phases in life',
                  content: life.length ? <ListCard rows={life.map((p, i) => phaseRow(p, i, true))} /> : undefined,
                },
                {
                  id: 'panoti',
                  label: 'Small Panoti',
                  heading: 'Small Panoti (Dhaiya) periods',
                  content: panoti.length ? <ListCard rows={panoti.map((p, i) => phaseRow(p, i, false))} /> : undefined,
                },
              ]}
            />
          </>
        );
      }}
    </Gate>
  );
}

// ---------- Divisional charts ----------

const DIVISIONAL: { id: ChartId; name: string }[] = [
  { id: 'D2', name: 'Hora' },
  { id: 'D3', name: 'Drekkana' },
  { id: 'D4', name: 'Chaturthamsha' },
  { id: 'D7', name: 'Saptamsha' },
  { id: 'D9', name: 'Navamsha' },
  { id: 'D10', name: 'Dashamsha' },
  { id: 'D12', name: 'Dwadashamsha' },
  { id: 'D16', name: 'Shodashamsha' },
  { id: 'D20', name: 'Vimshamsha' },
  { id: 'D24', name: 'Chaturvimshamsha' },
  { id: 'D30', name: 'Trimshamsha' },
  { id: 'D60', name: 'Shashtiamsha' },
];

export function DivisionalReport({ overrides, name }: ReportProps) {
  const { width } = useWindowDimensions();
  const [chartId, setChartId] = useState<ChartId>('D9');
  const state = useApi(() => load(getChart(chartId, overrides)), [chartId, overrides?.profileId]);
  const meta = DIVISIONAL.find(c => c.id === chartId)!;
  const size = width - 40;
  return (
    <>
      <ReportHero
        emblem={<Emblem Icon={DivisionalChartsIcon} />}
        title={`${meta.id} · ${meta.name}`}
        subtitle={`${possessive(name)} divisional chart`}
      />
      <View style={styles.sectionGap}>
        <SectionLabel>Choose chart</SectionLabel>
        <PillTabs
          items={DIVISIONAL.map(c => ({ id: c.id, label: c.id }))}
          selected={chartId}
          onSelect={setChartId}
          style={styles.bleed}
        />
        <Gate state={state}>
          {(chart: ChartData) => {
            const houses = chart.houses ?? {};
            const lagna = houses['1'];
            const lagnaSign = lagna ? ZODIAC_SIGNS[Number(lagna.sign_no) - 1]?.name : undefined;
            const inLagna = (lagna?.planet ?? []).map(p => p.name).filter(n => n.toLowerCase() !== 'ascendant');
            return (
              <View style={styles.sectionGap}>
                {Object.keys(houses).length > 0 ? (
                  <KundliChart houses={houses} size={size} />
                ) : chart.svg ? (
                  <SvgXml xml={chart.svg} width={size} height={size} />
                ) : (
                  <InfoCard title="Chart not available" />
                )}
                <FactsCard
                  facts={cleanFacts([
                    { label: 'Chart', value: `${meta.id} ${meta.name}` },
                    { label: 'Lagna sign', value: lagnaSign ?? '' },
                    { label: 'Planets in lagna', value: inLagna.length ? inLagna.join(', ') : 'None', full: true },
                  ])}
                />
              </View>
            );
          }}
        </Gate>
      </View>
    </>
  );
}

export const REPORTS: Record<KundliReportType, React.FC<ReportProps>> = {
  planets: PlanetsReport,
  dasha: DashaReport,
  asc: AscendantReport,
  mangal: ManglikReport,
  kaalsarpa: KaalSarpaReport,
  sadesati: SadeSatiReport,
  divisional: DivisionalReport,
};

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 80,
  },
  bleed: {
    marginHorizontal: -20,
  },
  sectionGap: {
    gap: 16,
  },
  hint: {
    marginTop: -6,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  listCard: {
    paddingVertical: 4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  listRowPressed: {
    opacity: 0.7,
  },
  chevron: {
    opacity: 0.6,
  },
  listRowHighlight: {
    backgroundColor: 'rgba(167, 216, 242, 0.12)',
  },
  listDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  listMain: {
    flex: 1,
    gap: 2,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  listTitleHighlight: {
    color: colors.primary,
  },
  listSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  listRight: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSoft,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: colors.black,
    includeFontPadding: false,
  },
});
