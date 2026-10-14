import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import GradientBackground from '../../GradientBackground';
import GlassCard from '../../GlassCard';
import ScreenHeader from '../../ScreenHeader';
import StatusBarShield, { useScrolledFromTop } from '../../StatusBarShield';
import { findSign } from '../../horoscope/zodiac';
import { colors, fonts } from '../../../theme';
import ExpandableText from '../../ExpandableText';

/*
 * Building blocks of the kundli report pages (Ascendant, Planets, Dasha, doshas, divisional
 * charts): a page frame with the screen header, a hero card with a round emblem, "QUICK FACTS"
 * grid and "ASTROLOGICAL ANALYSIS" pill tabs.
 */

export const HERO_ANGLE = 104.5;
export const CARD_ANGLE = 112.6;

/** Gradient page + header ("ASCENDANT REPORT") + scrolling body. */
export function ReportPage({ title, children }: { title: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { scrolled, onScroll } = useScrolledFromTop();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 21) + 24 }}
      >
        <ScreenHeader title={title} />
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

/** Translucent circle with an icon or a zodiac constellation inside. */
export function Emblem({
  sign,
  Icon,
  size = 96,
  iconAspect = 1,
}: {
  sign?: string | null;
  Icon?: React.FC<SvgProps>;
  size?: number;
  /** width / height of the icon artwork, so non-square icons aren't stretched */
  iconAspect?: number;
}) {
  const zodiac = findSign(sign ?? undefined);
  let content: React.ReactNode = null;
  if (zodiac) {
    const g = zodiac.glyph;
    const k = (size * 0.56) / Math.max(g.width, g.height);
    content = <g.Icon width={g.width * k} height={g.height * k} />;
  } else if (Icon) {
    // Fit the artwork in the same box at its own proportions (the SVGs don't keep their aspect)
    const box = size * (iconAspect > 1 ? 0.5 : 0.42);
    const w = iconAspect >= 1 ? box : box * iconAspect;
    const h = iconAspect >= 1 ? box / iconAspect : box;
    content = <Icon width={w} height={h} />;
  }
  return (
    <View style={[styles.emblem, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.emblemInner, { width: size - 14, height: size - 14, borderRadius: (size - 14) / 2 }]}>
        {content}
      </View>
    </View>
  );
}

export type StatusTone = 'good' | 'bad' | 'neutral';

const TONE: Record<StatusTone, { bg: string; border: string; text: string }> = {
  good: { bg: 'rgba(76, 217, 140, 0.18)', border: 'rgba(76, 217, 140, 0.7)', text: '#7CF0B0' },
  bad: { bg: 'rgba(255, 99, 99, 0.18)', border: 'rgba(255, 120, 120, 0.75)', text: '#FF9C9C' },
  neutral: { bg: 'rgba(167, 216, 242, 0.16)', border: colors.primaryHalf, text: colors.primary },
};

export function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  const t = TONE[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={[styles.chipDot, { backgroundColor: t.text }]} />
      <Text style={[styles.chipText, { color: t.text }]}>{label}</Text>
    </View>
  );
}

/** Hero card: emblem, big caps title, small subtitle, optional status chip. */
export function ReportHero({
  emblem,
  title,
  subtitle,
  status,
}: {
  emblem: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: { label: string; tone: StatusTone };
}) {
  return (
    <GlassCard angle={HERO_ANGLE} style={styles.hero}>
      {emblem}
      <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
        {title}
      </Text>
      {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
      {status && <StatusChip {...status} />}
    </GlassCard>
  );
}

/** Small caps, letter-spaced, muted section label ("QUICK FACTS"). */
export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.sectionLabelWrap, style]}>
      <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>
    </View>
  );
}

export type Fact = { label: string; value: string; /** take the whole row (long values) */ full?: boolean };

/** Drops facts without a value, so missing vendor fields simply don't show. */
export function cleanFacts(facts: Array<Fact | null | undefined | false>): Fact[] {
  return facts.filter((f): f is Fact => !!f && !!f.value && f.value.trim() !== '' && f.value !== '-');
}

/** 2-column grid of label / value pairs; `full` facts span both columns. */
export function FactsCard({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;
  // Pair consecutive half-width facts into rows
  const rows: Fact[][] = [];
  let pending: Fact | null = null;
  for (const f of facts) {
    if (f.full) {
      if (pending) rows.push([pending]);
      pending = null;
      rows.push([f]);
    } else if (pending) {
      rows.push([pending, f]);
      pending = null;
    } else {
      pending = f;
    }
  }
  if (pending) rows.push([pending]);

  return (
    <GlassCard angle={CARD_ANGLE} style={styles.factsCard}>
      {rows.map((row, i) => (
        <View key={i} style={[styles.factRow, i > 0 && styles.factRowDivider]}>
          {row.map(f => (
            <View key={f.label} style={[styles.fact, row.length === 1 && !f.full && styles.factHalf]}>
              <Text style={styles.factLabel}>{f.label.toUpperCase()}</Text>
              <Text style={styles.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>
      ))}
    </GlassCard>
  );
}

/** Horizontal pills: selected = filled primary with dark text, others glass. */
export function PillTabs<T extends string>({
  items,
  selected,
  onSelect,
  style,
}: {
  items: { id: T; label: string }[];
  selected: T;
  onSelect: (id: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.pillsScroll, style]}
      contentContainerStyle={styles.pills}
    >
      {items.map(item =>
        item.id === selected ? (
          <View key={item.id} style={styles.pillActive} accessibilityRole="tab" accessibilityState={{ selected: true }}>
            <Text style={[styles.pillText, styles.pillTextActive]}>{item.label}</Text>
          </View>
        ) : (
          <Pressable key={item.id} onPress={() => onSelect(item.id)} accessibilityRole="tab" accessibilityState={{ selected: false }}>
            <GlassCard angle={105.4} style={styles.pill}>
              <Text style={styles.pillText}>{item.label}</Text>
            </GlassCard>
          </Pressable>
        ),
      )}
    </ScrollView>
  );
}

export type AnalysisTab = {
  id: string;
  label: string;
  /** shown in primary caps above the text (defaults to the label) */
  heading?: string;
  paragraphs?: string[];
  /** bullet list (remedies) */
  bullets?: string[];
  /** custom content instead of text */
  content?: React.ReactNode;
};

const hasContent = (t: AnalysisTab) =>
  !!t.content || (t.paragraphs ?? []).some(p => p.trim()) || (t.bullets ?? []).some(b => b.trim());

/** Section title + pill tabs + a card with the tab's heading and text. Hidden when no tab has content. */
export function AnalysisSection({ title = 'Astrological analysis', tabs }: { title?: string; tabs: AnalysisTab[] }) {
  const visible = tabs.filter(hasContent);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  if (visible.length === 0) return null;
  const tab = visible.find(t => t.id === selected) ?? visible[0];
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      {visible.length > 1 && (
        <PillTabs items={visible.map(t => ({ id: t.id, label: t.label }))} selected={tab.id} onSelect={setSelected} style={styles.bleed} />
      )}
      <GlassCard angle={CARD_ANGLE} style={styles.analysisCard}>
        <Text style={styles.analysisHeading}>{(tab.heading ?? tab.label).toUpperCase()}</Text>
        {tab.content}
        {(tab.paragraphs ?? []).filter(p => p.trim()).map((p, i) => (
          <ExpandableText key={i} style={styles.paragraph}>
            {p.trim()}
          </ExpandableText>
        ))}
        {(tab.bullets ?? []).filter(b => b.trim()).map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.paragraph, styles.bulletText]}>{b.trim()}</Text>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

/** Section label + arbitrary content. */
export function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  body: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 27,
    paddingHorizontal: 19,
    gap: 6,
  },
  emblem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 216, 242, 0.35)',
    backgroundColor: 'rgba(167, 216, 242, 0.08)',
  },
  emblemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textMuted,
    includeFontPadding: false,
  },
  chip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  sectionLabelWrap: {
    marginBottom: -4,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 2,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  section: {
    gap: 16,
  },
  factsCard: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  factRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 12,
  },
  factRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  fact: {
    flex: 1,
    gap: 4,
  },
  factHalf: {
    flex: 0,
    width: '47%',
  },
  factLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.2,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  factValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  bleed: {
    marginHorizontal: -20,
  },
  pillsScroll: {
    flexGrow: 0,
  },
  pills: {
    gap: 10,
    paddingHorizontal: 20,
  },
  pillActive: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  pill: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.white,
    includeFontPadding: false,
  },
  pillTextActive: {
    color: colors.black,
  },
  analysisCard: {
    padding: 17,
    gap: 10,
  },
  analysisHeading: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 1.5,
    color: colors.primary,
    includeFontPadding: false,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textSoft,
    includeFontPadding: false,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: colors.primary,
  },
  bulletText: {
    flex: 1,
  },
});
