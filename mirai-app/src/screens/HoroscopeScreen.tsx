import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SvgProps } from 'react-native-svg';
import GlassCard from '../components/GlassCard';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import { formatToday } from '../components/TabHeader';
import ZodiacCircle from '../components/horoscope/ZodiacCircle';
import { findSign, smallGlyph, ZODIAC_SIGNS, ZodiacKey } from '../components/horoscope/zodiac';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import ChevronRight from '../assets/images/icon-chevron-right.svg';
import Constellation from '../assets/images/horoscope-constellation.svg';
import BriefcaseIcon from '../assets/images/horoscope-icon-briefcase.svg';
import StatusUpIcon from '../assets/images/horoscope-icon-status-up.svg';
import LovelyIcon from '../assets/images/horoscope-icon-lovely.svg';
import MuscleIcon from '../assets/images/horoscope-icon-muscle.svg';
import { useOnboarding } from '../context/OnboardingContext';
import UserAvatar from '../components/UserAvatar';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getHoroscope, isSetupRequired, type HoroscopeDay, type HoroscopePeriod } from '../api/horoscope';
import { firstSentence } from '../utils/astro';
import { colors, DESIGN_STATUS_BAR, DESIGN_WIDTH, fonts } from '../theme';
import ForecastCarousel, { hasForecasts } from '../components/horoscope/ForecastCarousel';

const nightSky = require('../assets/images/horoscope-night-sky.jpg');

// The photo layer is 375×532 in the design; the image inside is 562.4 tall, shifted up 30.2
const PHOTO_HEIGHT = 532;
const PHOTO_IMAGE_HEIGHT = 562.4;
const PHOTO_IMAGE_TOP = -30.2;
// Gap between the zodiac row and the period pills, where the constellation art sits
const ART_GAP = 247;
const ART_TOP = 39;

// All 12 signs on the tab: the user's sun sign first (selected by default), then zodiac order
const ALL_SIGNS: ZodiacKey[] = ZODIAC_SIGNS.map(s => s.key);
const SIGN_SIZE = 60;
const SIGN_GAP = 12;
const SIGNS_PADDING = 20;

function tabSigns(userSign: ZodiacKey | undefined): ZodiacKey[] {
  if (!userSign) return ALL_SIGNS;
  return [userSign, ...ALL_SIGNS.filter(k => k !== userSign)];
}

const PERIODS = ['Today', 'Tomorrow', 'Weekly', 'Monthly'] as const;
type Period = (typeof PERIODS)[number];

const PERIOD_QUERY: Record<Period, { period: HoroscopePeriod; day?: HoroscopeDay }> = {
  Today: { period: 'daily', day: 'today' },
  Tomorrow: { period: 'daily', day: 'tomorrow' },
  Weekly: { period: 'weekly' },
  Monthly: { period: 'monthly' },
};

type Insight = {
  id: 'career' | 'finance' | 'marriage' | 'health';
  title: string;
  /** teaser shown until the horoscope has loaded */
  description: string;
  /** prediction field whose first sentence replaces the teaser */
  field: 'profession' | 'emotions' | 'health';
  Icon: React.FC<SvgProps>;
};

// Each card opens its insights page (Divine has no finance category: it uses the work & money text)
const INSIGHTS: Insight[][] = [
  [
    {
      id: 'career',
      title: 'Career',
      description: 'Professional growth looks promising this week',
      field: 'profession',
      Icon: BriefcaseIcon,
    },
    {
      id: 'finance',
      title: 'Finance',
      description: 'Professional growth looks promising this week',
      field: 'profession',
      Icon: StatusUpIcon,
    },
  ],
  [
    { id: 'marriage', title: 'Marriage', description: 'Relationship harmony is strong today', field: 'emotions', Icon: LovelyIcon },
    { id: 'health', title: 'Health', description: 'Focus on wellness and self-care', field: 'health', Icon: MuscleIcon },
  ],
];

export default function HoroscopeScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data, user } = useOnboarding();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Horoscope'>>();
  const [period, setPeriod] = useState<Period>('Today');
  const scale = width / DESIGN_WIDTH;
  const userSign = findSign(user?.zodiacSign ?? undefined)?.key;
  const signs = tabSigns(userSign);
  // undefined = the user's own sign (the backend derives it from the date of birth)
  const [picked, setPicked] = useState<ZodiacKey | undefined>(() => findSign(route.params?.sign)?.key);
  const selected = picked ?? userSign;
  const isOwnSign = !picked || picked === userSign;
  const signsRef = useRef<ScrollViewInstance>(null);

  // Home's "View Details" opens the tab on a given sign (a new navigation = a new params object)
  const routeParams = route.params;
  useEffect(() => {
    if (routeParams?.sign) setPicked(findSign(routeParams.sign)?.key);
  }, [routeParams]);

  // Keep the selected circle in view
  useEffect(() => {
    const index = selected ? signs.indexOf(selected) : 0;
    const x = Math.max(0, SIGNS_PADDING + index * (SIGN_SIZE + SIGN_GAP) - (width - SIGN_SIZE) / 2);
    signsRef.current?.scrollTo({ x, animated: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, width]);

  const horoscope = useApi(
    () => getHoroscope({ ...PERIOD_QUERY[period], sign: isOwnSign ? undefined : picked }),
    [period, picked, isOwnSign],
  );
  const result = horoscope.data;
  const loaded = result && !isSetupRequired(result) ? result : undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR) + 24,
            paddingBottom: TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 24,
          },
        ]}
      >
        {/* Background: night-sky photo, then the blue→pink 50% gradient and 40% black overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={[styles.photo, { height: PHOTO_HEIGHT * scale }]}>
            <Image
              source={nightSky}
              resizeMode="cover"
              style={{ width, height: PHOTO_IMAGE_HEIGHT * scale, top: PHOTO_IMAGE_TOP * scale }}
            />
          </View>
          <LinearGradient
            colors={['rgba(69, 202, 255, 0.5)', 'rgba(255, 27, 107, 0.5)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        </View>

        {/* Greeting */}
        <View style={styles.header}>
          <Pressable
            style={styles.greeting}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <UserAvatar size={40} uri={user?.avatarUrl} />
            <View style={styles.greetingText}>
              <Text style={styles.hello} numberOfLines={1}>
                Hey, {data.name || 'there'}
              </Text>
              <Text style={styles.date}>{formatToday()}</Text>
            </View>
          </Pressable>
        </View>

        {/* Zodiac signs */}
        <ScrollView
          ref={signsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.signsScroll}
          contentContainerStyle={styles.signs}
        >
          {signs.map(key => {
            const sign = findSign(key)!;
            const glyph = smallGlyph(key);
            const isSelected = key === selected;
            return (
              <Pressable
                key={key}
                style={[styles.sign, !isSelected && styles.signIdle]}
                onPress={() => setPicked(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${sign.name} horoscope`}
              >
                <ZodiacCircle size={SIGN_SIZE} selected={isSelected}>
                  <glyph.Icon width={glyph.width} height={glyph.height} />
                </ZodiacCircle>
                <Text
                  style={[styles.signLabel, isSelected && styles.signLabelSelected]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {sign.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Constellation art over the sky */}
        <View style={styles.artGap}>
          <View style={[styles.art, { left: (width - 180) / 2 }]}>
            <Constellation width={180} height={125} />
          </View>
        </View>

        {/* Period pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={styles.pills}
        >
          {PERIODS.map(p =>
            p === period ? (
              <View key={p} style={styles.pillActive}>
                <Text style={styles.pillActiveText}>{p}</Text>
              </View>
            ) : (
              <Pressable key={p} onPress={() => setPeriod(p)} accessibilityRole="button">
                <GlassCard angle={104.5} style={styles.pill}>
                  <Text style={styles.pillText}>{p}</Text>
                </GlassCard>
              </Pressable>
            ),
          )}
        </ScrollView>

        {/* Forecasts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, styles.sectionTitleFlex]} numberOfLines={1}>
              {isOwnSign ? `Your ${period} Horoscope` : `${findSign(selected)?.name} · ${period}`}
            </Text>
            {!!selected && (
              <Pressable
                style={styles.viewDetails}
                onPress={() => navigation.navigate('HoroscopeDetail', { sign: selected })}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <ChevronRight width={20} height={20} style={styles.chevron} />
              </Pressable>
            )}
          </View>
          {horoscope.loading ? (
            <LoadingView />
          ) : horoscope.error ? (
            <ErrorCard error={horoscope.error} onRetry={horoscope.reload} />
          ) : hasForecasts(loaded) ? (
            <ForecastCarousel horoscope={loaded} />
          ) : (
            <InfoCard
              title="Add your date of birth"
              message="Your horoscope is based on your sun sign. Add your date of birth in your profile to see it."
              action={{ label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') }}
            />
          )}
        </View>

        {/* Astrology insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Astrology Insights
          </Text>
          <View style={styles.insights}>
            {INSIGHTS.map(row => (
              <View key={row[0].id} style={styles.insightRow}>
                {row.map(item => (
                  <InsightCard
                    key={item.id}
                    insight={item}
                    description={firstSentence(loaded?.prediction[item.field]) || item.description}
                    onPress={() => navigation.navigate('CareerInsights', { sign: selected, topic: item.id })}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function InsightCard({
  insight,
  description,
  onPress,
}: {
  insight: Insight;
  description: string;
  onPress?: () => void;
}) {
  const { title, Icon } = insight;
  return (
    <Pressable
      style={styles.insightPressable}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <GlassCard angle={94.66} style={styles.insight}>
        <View style={styles.insightIcon}>
          <Icon width={32} height={32} />
        </View>
        <Text style={styles.insightTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.insightDescription} numberOfLines={3}>
          {description}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    minHeight: 1424,
  },
  photo: {
    overflow: 'hidden',
  },
  dim: {
    backgroundColor: colors.gradientOverlay,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  greetingText: {
    gap: 2,
    flexShrink: 1,
  },
  hello: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 27,
    color: colors.white,
    includeFontPadding: false,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  signsScroll: {
    marginTop: 24,
    flexGrow: 0,
  },
  signs: {
    paddingHorizontal: SIGNS_PADDING,
    gap: SIGN_GAP,
  },
  sign: {
    width: SIGN_SIZE,
    alignItems: 'center',
    gap: 8,
  },
  signIdle: {
    opacity: 0.8,
  },
  signLabel: {
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  signLabelSelected: {
    fontFamily: fonts.semiBold,
  },
  artGap: {
    height: ART_GAP,
  },
  art: {
    position: 'absolute',
    top: ART_TOP,
    mixBlendMode: 'overlay',
  },
  // Keeps the row its natural height when the page content is shorter than minHeight
  pillsScroll: {
    flexGrow: 0,
  },
  pills: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pillActive: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  pillActiveText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.black,
    includeFontPadding: false,
  },
  // Design padding 16 minus the 1px border
  pill: {
    height: 32,
    paddingHorizontal: 15,
    borderRadius: 50,
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.white,
    includeFontPadding: false,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitleFlex: {
    flex: 1,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  chevron: {
    opacity: 0.8,
  },
  insights: {
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  insightPressable: {
    flex: 1,
  },
  insight: {
    padding: 15,
    gap: 4,
  },
  insightIcon: {
    alignSelf: 'flex-start',
    padding: 14,
    borderRadius: 60,
    backgroundColor: colors.iconButton,
  },
  insightTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 27,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  insightDescription: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.textSoft,
    includeFontPadding: false,
  },
});
