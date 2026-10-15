import React, { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import TabHeader from '../components/TabHeader';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import SegmentedControl, { Segment } from '../components/panchang/SegmentedControl';
import MonthCalendar, { CalendarDate } from '../components/panchang/MonthCalendar';
import AuspiciousTimings, { Muhurat } from '../components/panchang/AuspiciousTimings';
import FestivalCard, { daysUntil, Festival } from '../components/panchang/FestivalCard';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import NoteIcon from '../assets/images/panchang-note.svg';
import ClockIcon from '../assets/images/panchang-clock.svg';
import ClockIconActive from '../assets/images/panchang-clock-active.svg';
import MenuBoardIcon from '../assets/images/panchang-menu-board.svg';
import MenuBoardIconActive from '../assets/images/panchang-menu-board-active.svg';
import Chevron from '../assets/images/panchang-chevron-24.svg';
import { humanize } from '../components/KeyValueList';
import PanchangTable from '../components/panchang/PanchangTable';
import { sectionRows } from '../components/panchang/panchangRows';
import { BalamView, PanchakView } from '../components/panchang/ComputedSections';
import { EmptyText, ErrorCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import {
  getAuspiciousTimings,
  getFestivals,
  getPanchangSection,
  type ChandrabalamTarabalam,
  type PanchakaRahita,
  type PanchangDate,
  type PanchangObject,
  type PanchangSection,
} from '../api/panchang';
import { firstRange, formatRange, MUHURAT_INFO } from '../utils/astro';
import { colors, fonts } from '../theme';

type Tab = 'panchang' | 'festivals';

const SEGMENTS: Segment<Tab>[] = [
  { key: 'panchang', label: 'Panchang', Icon: ClockIcon, ActiveIcon: ClockIconActive },
  { key: 'festivals', label: 'Festivals', Icon: MenuBoardIcon, ActiveIcon: MenuBoardIconActive },
];

// Opens on today
const NOW = new Date();
const INITIAL_DATE: CalendarDate = { year: NOW.getFullYear(), month: NOW.getMonth(), day: NOW.getDate() };

/** Calendar date (0-based month) -> API date (1-based month) */
const toApiDate = (d: CalendarDate): PanchangDate => ({ day: d.day, month: d.month + 1, year: d.year });

// Order of the muhurat cards; the first one keeps its badge beside the name, as in the design
const MUHURAT_KEYS = ['brahma_muhurta', 'abhijit_muhurta', 'vijay_muhurta', 'godhuli_muhurta', 'amrit_kalam'];

function toMuhurats(raw: PanchangObject): Muhurat[] {
  const out: Muhurat[] = [];
  for (const key of MUHURAT_KEYS) {
    const range = firstRange(raw[key]);
    if (!range) continue;
    const info = MUHURAT_INFO[key];
    out.push({
      name: info.name,
      time: formatRange(range.start, range.end),
      rating: info.rating,
      recommendedFor: info.recommendedFor,
      badgeBesideName: out.length === 0,
    });
  }
  return out;
}

// Collapsed detail sections below Auspicious Timings; each loads its endpoint when opened
type DetailSection = { title: string; angle?: number; titleWidth?: number; section: PanchangSection };
const DETAIL_SECTIONS: DetailSection[] = [
  { title: 'Sunrise & Moonrise', section: 'sun-and-moon' },
  { title: 'Panchang', section: '' },
  { title: 'Lunar Month & Samvat', section: 'lunar-samvat' },
  { title: 'Rashi & Nakshatra', section: 'rashi-nakshatra' },
  { title: 'Ritu & Ayana', section: 'ritu-ayana' },
  { title: 'Auspicious Timings', section: 'auspicious-timings' },
  { title: 'Inauspicious Timings', section: 'inauspicious-timings' },
  { title: 'Nivas & Shool', section: 'nivas-shool' },
  { title: 'Other Calendars & Epoch', section: 'other-calendars-epoch' },
  // Computed by the backend (own renderers below instead of the key/value list)
  { title: 'Chandrabalam & Tarabalam', section: 'chandrabalam-tarabalam' },
  // Fixed 257 wide in the design so it breaks after "&"; the taller card has a flatter gradient
  { title: 'Panchaka Rahita Muhurta & Udaya Lagna', angle: 108.27, titleWidth: 257, section: 'panchaka-rahita' },
];

/** Festivals payload (object keyed by slug; values `{date,..}`, sect variants or arrays) -> cards */
function collectDates(v: unknown, acc: string[] = []): string[] {
  if (Array.isArray(v)) v.forEach(x => collectDates(x, acc));
  else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.date === 'string') acc.push(o.date);
    for (const [k, x] of Object.entries(o)) if (k !== 'date' && x && typeof x === 'object') collectDates(x, acc);
  }
  return acc;
}

function toFestivals(raw: PanchangObject | undefined, year: number, month: number): Festival[] {
  if (!raw) return [];
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const out: Festival[] = [];
  for (const [slug, v] of Object.entries(raw)) {
    const date = collectDates(v).find(d => d.startsWith(prefix));
    if (!date) continue;
    const o = (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | undefined;
    const name = typeof o?.name === 'string' && o.name ? o.name : humanize(slug);
    const iso = date.slice(0, 10);
    out.push({ day: Number(iso.slice(8, 10)), name, date: iso });
  }
  // Upcoming (today onwards) first by date, then this month's past ones (dimmed by the card)
  return out.sort((a, b) => {
    const pastA = daysUntil(a.date) < 0;
    const pastB = daysUntil(b.date) < 0;
    return pastA !== pastB ? (pastA ? 1 : -1) : a.date.localeCompare(b.date);
  });
}

export default function PanchangScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [tab, setTab] = useState<Tab>('panchang');
  const [visible, setVisible] = useState({ year: INITIAL_DATE.year, month: INITIAL_DATE.month });
  const [selected, setSelected] = useState<CalendarDate>(INITIAL_DATE);

  const dateKey = `${selected.year}-${selected.month}-${selected.day}`;
  const auspicious = useApi(() => getAuspiciousTimings(toApiDate(selected)), [dateKey]);
  const muhurats = auspicious.data ? toMuhurats(auspicious.data) : [];
  const festivalData = useApi(
    () => getFestivals(visible.month + 1, visible.year),
    [visible.year, visible.month],
  );
  const festivals = toFestivals(festivalData.data, visible.year, visible.month);

  const shiftMonth = (delta: number) => {
    const d = new Date(visible.year, visible.month + delta, 1);
    setVisible({ year: d.getFullYear(), month: d.getMonth() });
  };

  const selectDay = (date: CalendarDate) => {
    setSelected(date);
    // Tapping a dimmed day of an adjacent month jumps to that month
    if (date.year !== visible.year || date.month !== visible.month) {
      setVisible({ year: date.year, month: date.month });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 24 }}
      >
        <TabHeader title="Panchang" Icon={NoteIcon} />

        <View style={styles.content}>
          <SegmentedControl segments={SEGMENTS} value={tab} onChange={setTab} />

          <MonthCalendar
            year={visible.year}
            month={visible.month}
            selected={selected}
            markedDays={festivals.map(f => f.day)}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
            onSelect={selectDay}
          />

          {tab === 'panchang' ? (
            <View style={styles.panchang}>
              {auspicious.loading ? (
                <LoadingView />
              ) : auspicious.error ? (
                <ErrorCard error={auspicious.error} onRetry={auspicious.reload} />
              ) : muhurats.length > 0 ? (
                <AuspiciousTimings title="Auspicious Timings" items={muhurats} />
              ) : (
                <EmptyText>No auspicious timings for this day</EmptyText>
              )}
              <View style={styles.sections}>
                {DETAIL_SECTIONS.map(section => (
                  // Remount per date so an open section reloads for the new day
                  <DetailSectionRow key={`${section.title}-${dateKey}`} {...section} date={toApiDate(selected)} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.festivals}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Upcoming Festivals
              </Text>
              {festivalData.loading ? (
                <LoadingView />
              ) : festivalData.error ? (
                <ErrorCard error={festivalData.error} onRetry={festivalData.reload} />
              ) : festivals.length > 0 ? (
                <View style={styles.festivalList}>
                  {festivals.map(f => (
                    <FestivalCard
                      key={`${f.date}-${f.name}`}
                      {...f}
                      onPress={() => navigation.navigate('FestivalDetail', { name: f.name, date: f.date })}
                    />
                  ))}
                </View>
              ) : (
                <Text style={styles.empty}>No festivals this month</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function DetailSectionRow({
  title,
  angle = 115.25,
  titleWidth,
  section,
  date,
}: DetailSection & { date: PanchangDate }) {
  const [open, setOpen] = useState(false);
  const details = useApi(() => getPanchangSection(section, date), [], open);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <GlassCard angle={angle} style={[styles.sectionCard, open && styles.sectionCardOpen]}>
      <Pressable
        onPress={toggle}
        style={styles.sectionRow}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={[styles.sectionRowTitle, titleWidth ? { width: titleWidth } : styles.sectionRowTitleFlex]}>
          {title}
        </Text>
        <Chevron width={24} height={24} style={open ? styles.chevronUp : styles.chevronDown} />
      </Pressable>
      {open &&
        (details.loading ? (
          <LoadingView />
        ) : details.error ? (
          <ErrorCard error={details.error} onRetry={details.reload} />
        ) : section === 'chandrabalam-tarabalam' ? (
          <BalamView data={details.data as ChandrabalamTarabalam | undefined} />
        ) : section === 'panchaka-rahita' ? (
          <PanchakView data={details.data as PanchakaRahita | undefined} />
        ) : (
          <PanchangTable rows={sectionRows(section, details.data, date)} />
        ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 24,
  },
  panchang: {
    gap: 16,
  },
  sections: {
    gap: 10,
  },
  // Design padding 16 minus the 1px border
  sectionCard: {
    padding: 15,
  },
  sectionCardOpen: {
    gap: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionRowTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.18,
    color: colors.white,
    includeFontPadding: false,
  },
  sectionRowTitleFlex: {
    flex: 1,
  },
  chevronDown: {
    transform: [{ rotate: '90deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '-90deg' }],
  },
  festivals: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  festivalList: {
    gap: 10,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    includeFontPadding: false,
  },
});
