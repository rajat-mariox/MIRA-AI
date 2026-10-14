import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import { formatToday } from '../components/TabHeader';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import BellIcon from '../assets/images/icon-bell.svg';
import WalletIcon from '../assets/images/wallet-empty-wallet.svg';
import ChevronRight from '../assets/images/icon-chevron-right.svg';
import ClockIcon from '../assets/images/icon-clock.svg';
import DividerLine from '../assets/images/divider-line.svg';
import { useOnboarding } from '../context/OnboardingContext';
import ForecastCarousel, { hasForecasts } from '../components/horoscope/ForecastCarousel';
import UserAvatar from '../components/UserAvatar';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getHome } from '../api/home';
import { isSetupRequired } from '../api/horoscope';
import type { MuhuratSummary } from '../api/panchang';
import { ApiError } from '../api/client';
import { formatRange, MUHURAT_INFO } from '../utils/astro';
import { resolveMediaUrl } from '../utils/media';
import { colors, DESIGN_STATUS_BAR, fonts } from '../theme';
import { refreshUnreadCount, useUnreadCount } from '../notifications';

const bannerImage = require('../assets/images/banner-know-your-stars.png');


// Banner is 335×154.36 in the 375-wide design; it keeps that ratio on other widths
const BANNER_RATIO = 154.36 / 335;

// Design banner, shown when the admin has not published any banners (GET /banners is empty)
const DESIGN_BANNERS = [
  { id: 'stars-1', title: 'Know Your Stars', subtitle: 'Kundli, Panchang &\nDaily Horoscope', cta: 'View Today' },
  { id: 'stars-2', title: 'Know Your Stars', subtitle: 'Kundli, Panchang &\nDaily Horoscope', cta: 'View Today' },
  { id: 'stars-3', title: 'Know Your Stars', subtitle: 'Kundli, Panchang &\nDaily Horoscope', cta: 'View Today' },
];

type BannerItem = {
  id: string;
  title: string;
  subtitle?: string;
  cta?: string;
  imageUrl?: string;
  link?: string;
};

const DEFAULT_BANNER_CTA = 'View Today';

/** Banner `link` values that open a screen in the app instead of a URL (matched case-insensitively) */
const TAB_LINKS = ['Home', 'Horoscope', 'Kundli', 'Panchang', 'QueReport'] as const;
const SCREEN_LINKS = [
  'Wallet',
  'WalletHistory',
  'Notification',
  'Profile',
  'EditProfile',
  'AstroGuide',
  'HoroscopeDetail',
  'CareerInsights',
  'HelpSupport',
  'RateApp',
  'PrivacySecurity',
] as const;

// The design features Vijay Muhurat; fall back to the next available one
const HOME_MUHURATS: { key: string; field: keyof MuhuratSummary }[] = [
  { key: 'vijay_muhurta', field: 'vijayMuhurta' },
  { key: 'abhijit_muhurta', field: 'abhijitMuhurta' },
  { key: 'brahma_muhurta', field: 'brahmaMuhurta' },
  { key: 'amrit_kalam', field: 'amritKalam' },
  { key: 'godhuli_muhurta', field: 'godhuliMuhurta' },
];

function pickMuhurat(p: MuhuratSummary) {
  for (const m of HOME_MUHURATS) {
    const range = p[m.field] as { start: string; end: string } | null;
    if (range) {
      const info = MUHURAT_INFO[m.key];
      return {
        name: info.name,
        time: formatRange(range.start, range.end),
        rating: info.rating === 'very-good' ? 'Very Good' : info.rating === 'auspicious' ? 'Auspicious' : 'Highly Auspicious',
        recommendedFor: info.recommendedFor,
      };
    }
  }
  return null;
}

export default function HomeScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { data, user, setUser } = useOnboarding();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const bannerWidth = width - 40;
  const unreadCount = useUnreadCount();
  // bell dot: refetch the unread count whenever Home is shown again
  useFocusEffect(
    useCallback(() => {
      refreshUnreadCount();
    }, []),
  );

  const home = useApi(async () => {
    const res = await getHome();
    setUser(res.user);
    return res;
  }, []);
  const homeData = home.data;

  const apiBanners: BannerItem[] = (homeData?.banners ?? []).map(b => ({
    id: b.id ?? b._id,
    title: b.title,
    subtitle: b.subtitle,
    imageUrl: resolveMediaUrl(b.imageUrl),
    link: b.link,
    cta: b.buttonText?.trim() || DEFAULT_BANNER_CTA,
  }));
  const banners: BannerItem[] = apiBanners.length > 0 ? apiBanners : DESIGN_BANNERS;
  // The design shows the second banner as the current one
  const firstIndex = banners.length > 1 ? 1 : 0;
  const [bannerIndex, setBannerIndex] = useState(firstIndex);
  const bannerSet = apiBanners.length > 0 ? `api-${apiBanners.map(b => b.id).join(',')}` : 'design';
  // The carousel remounts at firstIndex when the banner set changes; keep the dots in sync
  useEffect(() => {
    setBannerIndex(firstIndex);
  }, [bannerSet, firstIndex]);
  const activeBanner = Math.max(0, Math.min(bannerIndex, banners.length - 1));

  const horoscope = homeData?.horoscope;
  const forecastData = horoscope && !isSetupRequired(horoscope) && hasForecasts(horoscope) ? horoscope : null;
  const muhurat = homeData?.panchang ? pickMuhurat(homeData.panchang) : null;
  const partError = (part: 'horoscope' | 'panchang') => {
    const e = homeData?.errors?.[part];
    return e ? new ApiError(e.statusCode, e.message) : undefined;
  };
  const goTab = (tab: 'Horoscope' | 'Panchang') => navigation.navigate('Main', { screen: tab });
  const userSign = homeData?.user.zodiacSign ?? user?.zodiacSign ?? undefined;
  const openHoroscope = () => navigation.navigate('Main', { screen: 'Horoscope', params: { sign: userSign } });
  // "View Today": today's horoscope page for the user's own rashi
  const openToday = () => navigation.navigate('HoroscopeDetail', { sign: userSign });

  // link: a URL (opened outside the app), an in-app route name, or empty / "Horoscope" (today's horoscope)
  const onBannerPress = (item: BannerItem) => {
    const link = item.link?.trim() ?? '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(link)) {
      Linking.openURL(link).catch(() => openToday());
      return;
    }
    const name = link.replace(/^\/+|\/+$/g, '').toLowerCase();
    const tab = TAB_LINKS.find(t => t.toLowerCase() === name);
    if (tab === 'Horoscope' || name === 'horoscopedetail') {
      openToday();
    } else if (tab) {
      navigation.navigate('Main', { screen: tab });
    } else {
      const screen = SCREEN_LINKS.find(r => r.toLowerCase() === name);
      if (screen) navigation.navigate(screen);
      else openToday();
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
        refreshControl={
          <RefreshControl
            refreshing={home.refreshing}
            onRefresh={home.refresh}
            tintColor={colors.primary}
            colors={[colors.onPrimary]}
            progressBackgroundColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR) + 16,
            paddingBottom: TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 24,
          },
        ]}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Pressable
            style={styles.greeting}
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <UserAvatar size={40} uri={homeData?.user.avatarUrl ?? user?.avatarUrl} />
            <View style={styles.greetingText}>
              <Text style={styles.hello} numberOfLines={1}>
                Hey, {homeData?.user.fullName || data.name || 'there'}
              </Text>
              <Text style={styles.date}>{formatToday()}</Text>
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('Wallet')}
              accessibilityRole="button"
              accessibilityLabel="Wallet"
            >
              {/* Wallet-card icon (28dp in the design) scaled to the bell's 20dp */}
              <WalletIcon width={20} height={20} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notification')}
              accessibilityRole="button"
              accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            >
              <BellIcon width={19.9995} height={19.9995} />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </Pressable>
          </View>
        </View>

        {/* Banner carousel */}
        <FlatList
          // Remount when the API banners replace the design banner
          key={bannerSet}
          data={banners}
          keyExtractor={b => b.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={firstIndex}
          getItemLayout={(_, index) => ({ length: bannerWidth, offset: bannerWidth * index, index })}
          onMomentumScrollEnd={e => setBannerIndex(Math.round(e.nativeEvent.contentOffset.x / bannerWidth))}
          style={styles.carousel}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.banner, { width: bannerWidth, height: bannerWidth * BANNER_RATIO }]}
              onPress={() => onBannerPress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <Image
                source={item.imageUrl ? { uri: item.imageUrl } : bannerImage}
                resizeMode="cover"
                style={styles.bannerImage}
              />
              <View style={styles.bannerContent}>
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!!item.subtitle && (
                    <Text style={styles.bannerSubtitle} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
                {!!item.cta && (
                  <Pressable style={styles.bannerButton} accessibilityRole="button" onPress={() => onBannerPress(item)}>
                    <Text style={styles.bannerButtonText}>{item.cta}</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )}
        />
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={i === activeBanner ? styles.dotActive : styles.dot} />
          ))}
        </View>

        {/* Today's horoscope */}
        <SectionHeader title="Your Today Horoscope" onPress={openHoroscope} />
        {home.loading && !homeData ? (
          <LoadingView />
        ) : home.error ? (
          <ErrorCard error={home.error} onRetry={home.reload} />
        ) : forecastData ? (
          <ForecastCarousel horoscope={forecastData} onPressCard={openHoroscope} />
        ) : isSetupRequired(horoscope) ? (
          <InfoCard
            title="Add your date of birth"
            message="Your horoscope is based on your sun sign. Add your date of birth in your profile to see it."
            action={{ label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') }}
          />
        ) : (
          <ErrorCard error={partError('horoscope')} onRetry={home.reload} />
        )}

        {/* Panchang */}
        <SectionHeader title="Panchang of the Day" onPress={() => goTab('Panchang')} />
        {home.loading && !homeData ? (
          <LoadingView />
        ) : home.error ? null : muhurat ? (
          <GlassCard angle={100.39} style={styles.panchang}>
            <View style={styles.panchangTop}>
              <View style={styles.muhurat}>
                <Text style={styles.muhuratName} numberOfLines={1}>
                  {muhurat.name}
                </Text>
                <View style={styles.timeRow}>
                  <ClockIcon width={16} height={16} />
                  <Text style={styles.muhuratTime}>{muhurat.time}</Text>
                </View>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{muhurat.rating}</Text>
              </View>
            </View>
            <View style={styles.divider}>
              <DividerLine width="100%" height={1} style={styles.dividerLine} />
            </View>
            <View style={styles.recommended}>
              <Text style={styles.recommendedLabel}>Recommended for:</Text>
              <Text style={styles.recommendedValue}>{muhurat.recommendedFor}</Text>
            </View>
          </GlassCard>
        ) : homeData?.panchang ? (
          <InfoCard title="No muhurat listed for today" />
        ) : (
          <ErrorCard error={partError('panchang')} onRetry={home.reload} />
        )}
      </ScrollView>
      <StatusBarShield visible={scrolled} />

    </View>
  );
}

function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        {title}
      </Text>
      <Pressable style={styles.viewDetails} accessibilityRole="button" hitSlop={8} onPress={onPress}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <ChevronRight width={20} height={20} style={styles.chevron} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.iconButton,
  },
  bellDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  carousel: {
    marginTop: 24,
    borderRadius: 16,
  },
  banner: {
    paddingLeft: 19,
    paddingRight: 128,
    paddingVertical: 20,
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    width: undefined,
    height: undefined,
    borderRadius: 16,
  },
  bannerContent: {
    width: 188,
    gap: 8,
  },
  bannerText: {
    paddingTop: 3,
  },
  bannerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 27,
    color: colors.white,
    includeFontPadding: false,
  },
  bannerSubtitle: {
    width: 142,
    height: 42,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  bannerButtonText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.black,
    includeFontPadding: false,
  },
  dots: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: colors.dotInactive,
    opacity: 0.3,
  },
  dotActive: {
    width: 20,
    height: 10,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  sectionHeader: {
    marginTop: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  chevron: {
    opacity: 0.8,
  },
  panchang: {
    padding: 15,
    gap: 12,
  },
  panchangTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  muhurat: {
    gap: 6,
    flexShrink: 1,
  },
  muhuratName: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.white,
    includeFontPadding: false,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muhuratTime: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.badgeBackground,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 16,
    color: colors.badgeText,
    includeFontPadding: false,
  },
  divider: {
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: -1,
  },
  recommended: {
    gap: 4,
  },
  recommendedLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  recommendedValue: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.white,
    includeFontPadding: false,
  },
});
