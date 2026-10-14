import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import ZodiacCircle from '../components/horoscope/ZodiacCircle';
import { compatibleSigns, findSign, ZODIAC_SIGNS, ZodiacKey, ZodiacSign } from '../components/horoscope/zodiac';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import type { RootStackParamList } from '../navigation/types';
import Svg, { Circle } from 'react-native-svg';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getHoroscope, isSetupRequired, type HoroscopePeriod } from '../api/horoscope';
import { useOnboarding } from '../context/OnboardingContext';
import { luckValue } from '../utils/astro';
import { colors, fonts, MONTHS, WEEKDAYS } from '../theme';
import ExpandableText from '../components/ExpandableText';

const CIRCLE = 74.75;
const ROW_GAP = 12;
const DEFAULT_SIGN: ZodiacKey = 'gemini';

const PERIODS = ['Today', 'Weekly', 'Monthly'] as const;
type Period = (typeof PERIODS)[number];
const PERIOD_TITLES: Record<Period, string> = { Today: 'Today', Weekly: 'This Week', Monthly: 'This Month' };

const PERIOD_QUERY: Record<Period, HoroscopePeriod> = { Today: 'daily', Weekly: 'weekly', Monthly: 'monthly' };

// e.g. "Tuesday, February 17, 2026"
function formatLongDate(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export default function HoroscopeDetailScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'HoroscopeDetail'>>();
  const { user } = useOnboarding();
  const [selected, setSelected] = useState<ZodiacKey>(
    findSign(route.params?.sign)?.key ?? findSign(user?.zodiacSign ?? undefined)?.key ?? DEFAULT_SIGN,
  );
  const [period, setPeriod] = useState<Period>('Today');
  const signsRef = useRef<ScrollViewInstance>(null);
  const sign = findSign(selected)!;

  // The sign is always sent, so this never needs a date of birth
  const horoscope = useApi(
    () => getHoroscope({ period: PERIOD_QUERY[period], day: 'today', sign: selected }),
    [period, selected],
  );
  const h = horoscope.data && !isSetupRequired(horoscope.data) ? horoscope.data : undefined;
  const luck = h?.prediction.luck;
  const lucky = {
    number: luckValue(luck, /number/i) ?? '--',
    colorName: luckValue(luck, /colou?r/i) ?? '--',
    colorCode: h?.special?.lucky_color_codes?.[0],
    time: luckValue(luck, /time|hour/i) ?? '--',
    day: luckValue(luck, /lucky day|weekday|day of the week/i) ?? '--',
  };
  const description = h ? h.prediction.personal || h.prediction.emotions : '';

  // Keep the preselected sign in view when it is past the first three circles
  const scrollToSelected = () => {
    const index = ZODIAC_SIGNS.findIndex(s => s.key === selected);
    if (index > 2) signsRef.current?.scrollTo({ x: (index - 2) * (CIRCLE + ROW_GAP), animated: false });
  };

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
        <ScreenHeader title="Horoscope" />

        {/* All signs */}
        <ScrollView
          ref={signsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.signsScroll}
          contentContainerStyle={styles.signs}
          onLayout={scrollToSelected}
        >
          {ZODIAC_SIGNS.map(s => (
            <SignCircle key={s.key} sign={s} selected={s.key === selected} onPress={() => setSelected(s.key)} />
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* Period switch */}
          <GlassCard angle={123.43} style={styles.segmented}>
            {PERIODS.map(p => (
              <Pressable
                key={p}
                style={[styles.segment, p === period && styles.segmentActive]}
                onPress={() => setPeriod(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: p === period }}
              >
                <Text style={[styles.segmentText, p === period && styles.segmentTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </GlassCard>

          {/* Selected sign */}
          <GlassCard angle={97.52} style={styles.signCard}>
            <View style={styles.signCardTop}>
              <ZodiacCircle size={72} selected>
                <sign.glyph.Icon width={sign.glyph.width} height={sign.glyph.height} />
              </ZodiacCircle>
              <View style={styles.signInfo}>
                <Text style={styles.signName} numberOfLines={1}>
                  {sign.name}
                </Text>
                <Text style={styles.signMeta}>{sign.dates}</Text>
                <Text style={styles.signMeta}>{formatLongDate()}</Text>
              </View>
            </View>
            {horoscope.loading ? (
              <LoadingView style={styles.inlineLoading} />
            ) : h ? (
              <ExpandableText style={styles.description}>{description}</ExpandableText>
            ) : null}
          </GlassCard>

          {!!horoscope.error && <ErrorCard error={horoscope.error} onRetry={horoscope.reload} />}
          {!horoscope.loading && !horoscope.error && !h && <InfoCard title="No horoscope available" />}

          {/* Lucky elements */}
          {h && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Lucky Elements {PERIOD_TITLES[period]}
            </Text>
            <View style={styles.luckyGrid}>
              <View style={styles.luckyRow}>
                <LuckyCard label="Lucky Number" value={lucky.number} />
                <LuckyCard label="Lucky Color" value={lucky.colorName} swatch={lucky.colorCode} />
              </View>
              <View style={styles.luckyRow}>
                <LuckyCard label="Lucky Time" value={lucky.time} />
                <LuckyCard label="Lucky Day" value={lucky.day} />
              </View>
            </View>
          </View>
          )}

          {/* Compatibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Best Compatibility
            </Text>
            <View style={styles.compatRow}>
              {compatibleSigns(selected).map(key => {
                const s = findSign(key)!;
                return (
                  <Pressable
                    key={key}
                    style={styles.compatItem}
                    onPress={() => setSelected(key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.name} horoscope`}
                  >
                    <ZodiacCircle size={CIRCLE} style={styles.compatCircle}>
                      <s.glyph.Icon width={s.glyph.width} height={s.glyph.height} />
                      <Text style={styles.circleLabel} numberOfLines={1}>
                        {s.name}
                      </Text>
                    </ZodiacCircle>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function SignCircle({ sign, selected, onPress }: { sign: ZodiacSign; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={!selected && styles.idle}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={sign.name}
    >
      <ZodiacCircle size={CIRCLE} selected={selected} style={styles.rowCircle}>
        <sign.glyph.Icon width={sign.glyph.width} height={sign.glyph.height} />
        <Text style={[styles.circleLabel, selected && styles.circleLabelSelected]} numberOfLines={1}>
          {sign.name}
        </Text>
      </ZodiacCircle>
    </Pressable>
  );
}

function LuckyCard({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <GlassCard angle={99.33} style={styles.lucky}>
      <Text style={styles.luckyLabel} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.luckyValueRow}>
        {!!swatch && (
          <Svg width={25} height={25}>
            <Circle cx={12.5} cy={12.5} r={12.5} fill={swatch} />
          </Svg>
        )}
        <Text style={styles.luckyValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  signsScroll: {
    marginTop: 24,
    flexGrow: 0,
  },
  signs: {
    paddingHorizontal: 20,
    gap: ROW_GAP,
  },
  idle: {
    opacity: 0.8,
  },
  rowCircle: {
    gap: 6,
  },
  compatCircle: {
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  circleLabel: {
    fontFamily: fonts.regular,
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  circleLabelSelected: {
    fontFamily: fonts.semiBold,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 24,
  },
  // Design padding 4 minus the 1px border
  segmented: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 3,
    borderRadius: 50,
  },
  segment: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.white,
    includeFontPadding: false,
  },
  segmentTextActive: {
    color: colors.black,
  },
  signCard: {
    padding: 15,
    gap: 16,
  },
  signCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  signInfo: {
    flex: 1,
    gap: 2,
  },
  signName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  signMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  inlineLoading: {
    paddingVertical: 8,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
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
  luckyGrid: {
    gap: 10,
  },
  luckyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lucky: {
    flex: 1,
    padding: 15,
    gap: 4,
  },
  luckyLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.8)',
    includeFontPadding: false,
  },
  luckyValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  luckyValue: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  compatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  compatItem: {
    flex: 1,
    alignItems: 'center',
    opacity: 0.8,
  },
});
