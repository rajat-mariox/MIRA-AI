import React, { useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SvgXml } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import KundliChart from '../components/kundli/KundliChart';
import KundliLegend from '../components/kundli/KundliLegend';
import PlanetsTable, { PlanetRow } from '../components/kundli/PlanetsTable';
import BirthDetailsTable, { BirthDetail } from '../components/kundli/BirthDetailsTable';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import PlanetsIcon from '../assets/images/kundli-planets.svg';
import DashaIcon from '../assets/images/kundli-dasha.svg';
import AscIcon from '../assets/images/kundli-asc.svg';
import MangalDoshaIcon from '../assets/images/kundli-mangal-dosha.svg';
import KaalsarpaDoshaIcon from '../assets/images/kundli-kaalsarpa-dosha.svg';
import SadeSatiIcon from '../assets/images/kundli-sade-sati.svg';
import DivisionalChartsIcon from '../assets/images/kundli-divisional-charts.svg';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import {
  getBasicDetails,
  getChart,
  getKundliProfile,
  getPlanetaryPositions,
  isKundliIncomplete,
  type ChartData,
  type ChartId,
  type KundliObject,
  type KundliOverrides,
  type KundliProfile,
  type KundliResult,
} from '../api/kundli';
import type { KundliReportType } from '../components/kundli/report/reports';
import { useOnboarding } from '../context/OnboardingContext';
import type { KundliStackParamList, RootStackParamList } from '../navigation/types';
import { humanize } from '../components/KeyValueList';
import { colors, fonts } from '../theme';

type TabId = 'lagna' | 'navamsha' | 'moon' | 'planets' | 'birth';

// Where the selected pill's left edge sits on screen in each Figma frame
const PILL_SCREEN_X: Partial<Record<TabId, number>> = { moon: 94, planets: 83 };

const TABS: { id: TabId; label: string }[] = [
  { id: 'lagna', label: 'Lagna' },
  { id: 'navamsha', label: 'Navamsha' },
  { id: 'moon', label: 'Moon chart' },
  { id: 'planets', label: 'Planets position' },
  { id: 'birth', label: 'Birth details' },
];

type Feature = {
  id: KundliReportType;
  label: string;
  Icon: React.FC<SvgProps>;
  width: number;
  height: number;
  /** the Mangal dosha icon is mirrored in the design */
  mirrored?: boolean;
};

// Feature shortcuts under the Lagna chart, three per row; the last one spans the full width
const FEATURE_ROWS: Feature[][] = [
  [
    { id: 'planets', label: 'Planets', Icon: PlanetsIcon, width: 22, height: 22 },
    { id: 'dasha', label: 'Dasha', Icon: DashaIcon, width: 22, height: 22 },
    { id: 'asc', label: 'Asc', Icon: AscIcon, width: 22, height: 22 },
  ],
  [
    {
      id: 'mangal',
      label: 'Mangal dosha',
      Icon: MangalDoshaIcon,
      width: 18.3334,
      height: 22.5322,
      mirrored: true,
    },
    { id: 'kaalsarpa', label: 'kaalsarpa dosha', Icon: KaalsarpaDoshaIcon, width: 22, height: 22 },
    // The artwork is wide (22×15.44), so it is drawn larger to match the weight of the square icons
    { id: 'sadesati', label: 'sade sati', Icon: SadeSatiIcon, width: 30, height: 21.053 },
  ],
  [{ id: 'divisional', label: 'Divisional charts.', Icon: DivisionalChartsIcon, width: 22, height: 22 }],
];

const TAB_CHART: Partial<Record<TabId, ChartId>> = { lagna: 'D1', navamsha: 'D9', moon: 'MOON' };

type Obj = Record<string, unknown>;
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
const pick = (o: Obj, keys: string[]) => {
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return '';
};

/** 23.6 -> "23°36'00''" */
function dms(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return str(v);
  const d = Math.floor(n);
  const mFloat = (n - d) * 60;
  const m = Math.floor(mFloat);
  const sec = Math.round((mFloat - m) * 60);
  const p2 = (x: number) => String(x).padStart(2, '0');
  return `${p2(d)}°${p2(m)}'${p2(sec)}''`;
}

/** Planet rows from /kundli/planetary-positions (vendor shape: an array of planets somewhere in data). */
function toPlanetRows(data: KundliObject): PlanetRow[] {
  const list =
    (Array.isArray(data.planets) && data.planets) ||
    (Array.isArray(data.planet) && data.planet) ||
    Object.values(data).find(v => Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') ||
    [];
  return (list as Obj[]).map(p => {
    const naks = pick(p, ['nakshatra', 'nakshatra_name', 'naksahtra']);
    const pada = pick(p, ['nakshatra_pada', 'pada', 'nakshatra_pad']);
    const retro = ['true', '1', 'yes', 'r'].includes(pick(p, ['is_retro', 'retro', 'isRetro']).toLowerCase());
    return {
      planet: `${pick(p, ['name', 'planet', 'full_name'])}${retro ? '*' : ''}`,
      sign: pick(p, ['sign', 'rasi', 'sign_name', 'rashi']),
      naks: naks ? `${naks}${pada ? `(${pada})` : ''}` : '-',
      degree: dms(p.local_degree ?? p.norm_degree ?? p.degree ?? p.longitude ?? p.full_degree),
    };
  });
}

/** Birth rows: a saved profile's details, or the user's own profile. */
function toBirthRows(data: KundliObject, user: ReturnType<typeof useOnboarding>['user'], profile?: KundliProfile): BirthDetail[] {
  const dob = user?.dateOfBirth ? new Date(user.dateOfBirth) : null;
  const [py, pm, pd] = (profile?.dateOfBirth ?? '').split('-').map(Number);
  const day = profile ? pd : dob?.getUTCDate();
  const month = profile ? pm : dob ? dob.getUTCMonth() + 1 : undefined;
  const year = profile ? py : dob?.getUTCFullYear();
  const [h, m] = ((profile ? profile.birthTime : user?.birthTime) ?? '').split(':');
  const g = profile ? profile.gender : user?.gender;
  const gender = g ? g[0].toUpperCase() + g.slice(1) : '-';
  return [
    { label: 'Name :', value: (profile ? profile.name : user?.fullName) || '-' },
    { label: 'Date :', value: day ? `${day} : ${month} : ${year}` : '-' },
    { label: 'Time :', value: h ? `${Number(h)} : ${Number(m)} : 0` : '-' },
    { label: 'Place :', value: (profile ? profile.birthPlace : user?.birthPlace) || '-' },
    { label: 'Gender :', value: gender },
    { label: 'Ayanamsa :', value: pick(data, ['ayanamsa', 'ayanamsha']) || '-' },
    { label: 'DST :', value: pick(data, ['dst']) || '0' },
    { label: 'Rashi :', value: pick(data, ['rashi', 'moonsign', 'moon_sign', 'sign', 'rasi']) || '-' },
    { label: 'Ba. Dasa :', value: pick(data, ['balance_dasha', 'dasha_balance', 'bal_dasha', 'dasa_balance']) || '-' },
  ];
}

type TabData =
  | { kind: 'chart'; chart: ChartData }
  | { kind: 'planets'; rows: PlanetRow[] }
  | { kind: 'birth'; data: KundliObject; profile?: KundliProfile }
  | { kind: 'incomplete'; missing: string[] };

function unwrap<T>(r: KundliResult<T>): T | { incomplete: string[] } {
  return isKundliIncomplete(r) ? { incomplete: r.missingFields } : r;
}

async function loadTab(tab: TabId, o?: KundliOverrides): Promise<TabData> {
  const chartId = TAB_CHART[tab];
  const profileReq = tab === 'birth' && o?.profileId ? getKundliProfile(o.profileId) : undefined;
  const r = chartId
    ? unwrap(await getChart(chartId, o))
    : tab === 'planets'
      ? unwrap(await getPlanetaryPositions(o))
      : unwrap(await getBasicDetails(o));
  if ('incomplete' in r && Array.isArray(r.incomplete)) return { kind: 'incomplete', missing: r.incomplete as string[] };
  if (chartId) return { kind: 'chart', chart: r as ChartData };
  if (tab === 'planets') return { kind: 'planets', rows: toPlanetRows(r as KundliObject) };
  return { kind: 'birth', data: r as KundliObject, profile: await profileReq };
}

function ChartView({ chart, size }: { chart: ChartData; size?: number }) {
  if (chart.houses && Object.keys(chart.houses).length > 0) return <KundliChart houses={chart.houses} size={size} />;
  // Fallback: the vendor's own SVG drawing in the same square
  if (chart.svg) return <SvgXml xml={chart.svg} width={size ?? '100%'} height={size ?? 335} />;
  return <InfoCard title="Chart not available" />;
}

function IncompleteCard({ missing }: { missing: string[] }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <InfoCard
      title="Complete your birth details"
      message={`Your kundli needs: ${missing.map(humanize).join(', ')}.`}
      action={{ label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') }}
    />
  );
}

export default function YourKundliScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TabId>('lagna');
  const { user } = useOnboarding();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<KundliStackParamList, 'YourKundli'>>();
  const profileId = route.params?.profileId;
  const profileName = route.params?.name;
  const overrides = useMemo<KundliOverrides | undefined>(() => (profileId ? { profileId } : undefined), [profileId]);
  const tabData = useApi(() => loadTab(tab, overrides), [tab, profileId]);
  const td = tabData.data;

  const onFeature = (f: Feature) => {
    // Each shortcut opens its full-screen report for this kundli
    navigation.navigate('KundliReport', { type: f.id, profileId, name: profileName });
  };

  // Scroll the pill row the way each Figma frame shows it: the selected pill's left
  // edge sits at this x on screen (Lagna/Navamsha unscrolled, Birth details at the end)
  const pillRow = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const pillLayouts = useRef<Partial<Record<TabId, { x: number; width: number }>>>({});
  const rowContentWidth = useRef(0);

  const selectTab = (id: TabId) => {
    setTab(id);
    const pill = pillLayouts.current[id];
    if (!pill) return;
    const maxX = Math.max(0, rowContentWidth.current - width);
    const target = PILL_SCREEN_X[id];
    const x = target === undefined ? 0 : Math.min(maxX, Math.max(0, pill.x - target));
    pillRow.current?.scrollTo({ x: id === 'birth' ? maxX : x, animated: true });
  };

  const onPillLayout = (id: TabId) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    pillLayouts.current[id] = { x, width: w };
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      {/* The whole page scrolls, header included, as in the 992dp tall Lagna frame */}
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 24 }}
      >
        <ScreenHeader title={profileId && profileName ? `${profileName}'s Kundli` : 'Your Kundli'} />

        <ScrollView
          ref={pillRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={styles.pillRowContent}
          onContentSizeChange={w => {
            rowContentWidth.current = w;
          }}
        >
          {TABS.map(t =>
            t.id === tab ? (
              <View
                key={t.id}
                style={styles.pillSelected}
                onLayout={onPillLayout(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: true }}
              >
                <Text style={[styles.pillText, styles.pillTextSelected]}>{t.label}</Text>
              </View>
            ) : (
              <Pressable
                key={t.id}
                onPress={() => selectTab(t.id)}
                onLayout={onPillLayout(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: false }}
              >
                <GlassCard angle={105.4} style={styles.pill}>
                  <Text style={styles.pillText}>{t.label}</Text>
                </GlassCard>
              </Pressable>
            ),
          )}
        </ScrollView>

        <View style={styles.body}>
          {tabData.loading ? (
            <LoadingView />
          ) : tabData.error ? (
            <ErrorCard error={tabData.error} onRetry={tabData.reload} />
          ) : td?.kind === 'incomplete' ? (
            <IncompleteCard missing={td.missing} />
          ) : td?.kind === 'chart' ? (
            <ChartView chart={td.chart} />
          ) : null}

          {tab === 'lagna' && (
            <>
              <View style={styles.legend}>
                <KundliLegend />
              </View>
              <View style={styles.features}>
                {FEATURE_ROWS.map(row => (
                  <View key={row[0].id} style={styles.featureRow}>
                    {row.map(f => (
                      <Pressable
                        key={f.id}
                        style={styles.featureCell}
                        onPress={() => onFeature(f)}
                        accessibilityRole="button"
                        accessibilityLabel={f.label}
                      >
                        <GlassCard
                          angle={row.length === 1 ? 108.27 : 96.06}
                          style={styles.featureCard}
                        >
                          <f.Icon
                            width={f.width}
                            height={f.height}
                            style={f.mirrored ? styles.mirrored : undefined}
                          />
                          <Text style={styles.featureLabel} numberOfLines={1}>
                            {f.label}
                          </Text>
                        </GlassCard>
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>
            </>
          )}

          {tab === 'planets' && td?.kind === 'planets' && <PlanetsTable rows={td.rows} />}
          {tab === 'birth' && td?.kind === 'birth' && (
            <BirthDetailsTable rows={toBirthRows(td.data, user, td.profile)} />
          )}
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  pillRow: {
    flexGrow: 0,
    marginTop: 24,
  },
  pillRowContent: {
    gap: 10,
    paddingHorizontal: 20,
  },
  pillSelected: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  pill: {
    height: 32,
    justifyContent: 'center',
    // 16dp in the design, where the 1dp border sits inside the padding
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  pillTextSelected: {
    color: colors.black,
  },
  body: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  legend: {
    marginTop: 6,
  },
  features: {
    marginTop: 20,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 6,
  },
  featureCell: {
    flex: 1,
  },
  featureCard: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    // 4dp in the design, where the 1dp border sits inside the padding
    padding: 3,
    borderRadius: 8,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  featureLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 18,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
});
