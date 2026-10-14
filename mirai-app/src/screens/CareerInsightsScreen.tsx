import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import UserOctagonIcon from '../assets/images/career-icon-user-octagon.svg';
import NoteTextIcon from '../assets/images/career-icon-note-text.svg';
import MedalStarIcon from '../assets/images/career-icon-medal-star.svg';
import DividerLine from '../assets/images/divider-line.svg';
import ScoreBar from '../components/ScoreBar';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getInsight, isSetupRequired, type InsightData, type InsightTopic } from '../api/horoscope';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { findSign } from '../components/horoscope/zodiac';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';
import ExpandableText from '../components/ExpandableText';

export type { InsightTopic };

/** Shown under the card headings until the backend sends its `basis`. */
const DEFAULT_SUBTITLE = 'Based on planetary positions';

const TOPICS: Record<InsightTopic, { title: string; noun: string }> = {
  career: { title: 'Career Insights', noun: 'Career' },
  finance: { title: 'Finance Insights', noun: 'Finance' },
  marriage: { title: 'Marriage Insights', noun: 'Love & marriage' },
  health: { title: 'Health Insights', noun: 'Health' },
};

// Card fill angles from the design (remedy cards 1-3)
const REMEDY_ANGLES = [110.14, 113.07, 110.14];

/**
 * GET /horoscope/insights/:topic. For the user's own rashi it is personalised from their birth
 * chart (houses, lords, running dasha + today's horoscope); for another picked sign it is that
 * sign's generic horoscope. null = birth details needed.
 */
async function loadInsight(topic: InsightTopic, sign?: string): Promise<InsightData | null> {
  const r = await getInsight(topic, findSign(sign)?.key);
  return isSetupRequired(r) ? null : r;
}

export default function CareerInsightsScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CareerInsights'>>();
  const sign = findSign(route.params?.sign)?.key;
  const topicKey = route.params?.topic ?? 'career';
  const topic = TOPICS[topicKey];
  const career = useApi(() => loadInsight(topicKey, sign), [sign, topicKey]);
  const data = career.data ?? undefined;
  const score = data?.score ?? undefined;
  const subtitle = data?.basis || DEFAULT_SUBTITLE;

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
        <ScreenHeader title={topic.title} />

        <View style={styles.content}>
          {career.loading ? (
            <LoadingView />
          ) : career.error ? (
            <ErrorCard error={career.error} onRetry={career.reload} />
          ) : !data ? (
            <InfoCard
              title="Add your date of birth"
              message={`${topic.noun} insights are based on your sign. Add your date of birth in your profile.`}
              action={{ label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') }}
            />
          ) : (
            <>
              {/* Rating */}
              <GlassCard angle={98.39} style={styles.card}>
                <View style={styles.cardHeader}>
                  <CardIcon Icon={UserOctagonIcon} />
                  <CardHeading title="Rating" subtitle={subtitle} />
                  <View style={styles.score}>
                    <Text style={styles.scoreValue}>{score === undefined ? '--' : Math.round(score)}</Text>
                    <Text style={styles.scoreMax}>/ 100</Text>
                  </View>
                </View>
                <View style={styles.rating}>
                  <ScoreBar percent={score ?? 0} width={306} thickness={6} style={styles.ratingBar} />
                </View>
                <ExpandableText style={styles.body}>{data.today}</ExpandableText>
              </GlassCard>

              {/* Predictions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  Predictions
                </Text>
                <View style={styles.list}>
                  {data.periods.map(p => (
                    <GlassCard key={p.id} angle={99.04} style={[styles.card, styles.prediction]}>
                      <View style={styles.cardHeader}>
                        <CardIcon Icon={NoteTextIcon} />
                        <CardHeading title={p.title} subtitle={subtitle} />
                      </View>
                      <View style={styles.divider}>
                        <DividerLine width="100%" height={1} style={styles.dividerLine} />
                      </View>
                      <ExpandableText style={styles.body}>{p.text || 'No prediction available.'}</ExpandableText>
                    </GlassCard>
                  ))}
                </View>
              </View>

              {/* Remedies */}
              {data.remedies.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    Recommended Remedies
                  </Text>
                  <View style={styles.list}>
                    {data.remedies.map((text, i) => (
                      <GlassCard key={`${i}-${text}`} angle={REMEDY_ANGLES[i % REMEDY_ANGLES.length]} style={styles.remedy}>
                        <MedalStarIcon width={30} height={30} />
                        <Text style={styles.remedyText}>{text}</Text>
                      </GlassCard>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function CardIcon({ Icon }: { Icon: React.FC<SvgProps> }) {
  return (
    <View style={styles.icon}>
      <Icon width={30} height={30} />
    </View>
  );
}

function CardHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  // Card paddings are the design value minus the 1px border
  card: {
    padding: 15,
    gap: 16,
  },
  prediction: {
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    padding: 9,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  heading: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  score: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0.3955,
    color: '#A8D8F2',
    includeFontPadding: false,
  },
  scoreMax: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  // 3dp slot; the bar art is 306×6 and sits 3dp up and left of it
  rating: {
    height: 3,
  },
  ratingBar: {
    position: 'absolute',
    left: -3,
    top: -3,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  divider: {
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: -1,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  list: {
    gap: 10,
  },
  remedy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
  },
  remedyText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
});
