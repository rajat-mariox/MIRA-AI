import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import GlassCard from '../components/GlassCard';
import ExpandableText from '../components/ExpandableText';
import { ErrorCard, LoadingView } from '../components/StateViews';
import {
  CARD_ANGLE,
  Emblem,
  FactsCard,
  HERO_ANGLE,
  ReportPage,
  ReportSection,
  cleanFacts,
} from '../components/kundli/report/ReportBlocks';
import DiyaIcon from '../components/panchang/DiyaIcon';
import { festivalDateLabel } from '../components/panchang/FestivalCard';
import { findSign, smallGlyph } from '../components/horoscope/zodiac';
import useApi from '../hooks/useApi';
import { getFestivalInsight, type FestivalInsight } from '../api/panchang';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

const GOOD = '#7CF0B0';
const BAD = '#FF9C9C';

/**
 * A festival from Panchang -> Festivals: its significance and what it means for the user's
 * rashi (AI reading from the backend, cached there for 30 days), in the kundli report style.
 */
export default function FestivalDetailScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'FestivalDetail'>>();
  const { name, date } = params;
  const insight = useApi(() => getFestivalInsight(name, date), [name, date]);

  return (
    <ReportPage title={name}>
      <Hero name={name} date={date} rashi={insight.data?.rashi} />
      {insight.loading ? (
        <View>
          <LoadingView />
          <Text style={styles.loadingText}>Reading the stars for this festival…</Text>
        </View>
      ) : insight.error ? (
        <ErrorCard error={insight.error} onRetry={insight.reload} />
      ) : insight.data ? (
        <InsightSections data={insight.data} />
      ) : null}
    </ReportPage>
  );
}

function Hero({ name, date, rashi }: { name: string; date: string; rashi?: string }) {
  const sign = findSign(rashi);
  const glyph = sign ? smallGlyph(sign.key) : null;
  return (
    <GlassCard angle={HERO_ANGLE} style={styles.hero}>
      <Emblem Icon={DiyaIcon} />
      <Text style={styles.heroTitle} numberOfLines={2} adjustsFontSizeToFit>
        {name}
      </Text>
      <Text style={styles.heroSubtitle}>{festivalDateLabel(date, true)}</Text>
      {sign && (
        <View style={styles.rashiChip}>
          {glyph && <glyph.Icon width={(glyph.width * 16) / glyph.height} height={16} />}
          <Text style={styles.rashiText}>For your rashi: {sign.name}</Text>
        </View>
      )}
    </GlassCard>
  );
}

function InsightSections({ data }: { data: FestivalInsight }) {
  const { significance, forYourRashi, dos, donts, luckyColor, pujaTip } = data.insight;
  return (
    <>
      <ReportSection title="Significance">
        <GlassCard angle={CARD_ANGLE} style={styles.card}>
          <ExpandableText style={styles.paragraph}>{significance}</ExpandableText>
        </GlassCard>
      </ReportSection>

      <ReportSection title="For your rashi">
        <GlassCard angle={CARD_ANGLE} style={styles.card}>
          <ExpandableText style={styles.paragraph}>{forYourRashi}</ExpandableText>
        </GlassCard>
      </ReportSection>

      <BulletSection title="Do's" items={dos} color={GOOD} />
      <BulletSection title="Don'ts" items={donts} color={BAD} />

      <ReportSection title="Lucky color & puja tip">
        <FactsCard
          facts={cleanFacts([
            { label: 'Lucky color', value: luckyColor },
            { label: 'Puja tip', value: pujaTip },
          ])}
        />
      </ReportSection>
    </>
  );
}

function BulletSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  const rows = items.map(i => i.trim()).filter(Boolean);
  if (rows.length === 0) return null;
  return (
    <ReportSection title={title}>
      <GlassCard angle={CARD_ANGLE} style={styles.card}>
        {rows.map((item, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: color, shadowColor: color }]} />
            <Text style={[styles.paragraph, styles.bulletText]}>{item}</Text>
          </View>
        ))}
      </GlassCard>
    </ReportSection>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 27,
    paddingHorizontal: 19,
    gap: 6,
  },
  heroTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: 1.5,
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
  rashiChip: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.primaryHalf,
    backgroundColor: 'rgba(167, 216, 242, 0.16)',
  },
  rashiText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: colors.primary,
    includeFontPadding: false,
  },
  loadingText: {
    marginTop: -12,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textMuted,
    includeFontPadding: false,
  },
  card: {
    padding: 17,
    gap: 10,
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
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  bulletText: {
    flex: 1,
  },
});
