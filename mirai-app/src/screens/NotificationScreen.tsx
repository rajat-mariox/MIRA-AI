import React, { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import { ErrorCard, LoadingView, PillButton } from '../components/StateViews';
import useApi from '../hooks/useApi';
import {
  listNotifications,
  markNotificationRead,
  type AppNotification,
} from '../api/notifications';
import { openNotificationTarget, setUnreadCount } from '../notifications';
import { colors, fonts, MONTHS, WEEKDAYS } from '../theme';

const PAGE_SIZE = 30;
// CSS angle of the card fill in the design (festival reminder cards)
const CARD_ANGLE = 109.8892;

const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function sectionTitle(d: Date) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return 'Today';
  if (dayKey(d) === dayKey(yesterday)) return 'Yesterday';
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTime(d: Date) {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
}

type Section = { key: string; title: string; items: AppNotification[] };

/** Newest first, grouped into Today / Yesterday / date sections. */
function groupByDay(items: AppNotification[]): Section[] {
  const sections: Section[] = [];
  for (const n of items) {
    const d = new Date(n.createdAt);
    const key = Number.isNaN(d.getTime()) ? 'unknown' : dayKey(d);
    let s = sections[sections.length - 1];
    if (!s || s.key !== key) {
      s = { key, title: key === 'unknown' ? 'Earlier' : sectionTitle(d), items: [] };
      sections.push(s);
    }
    s.items.push(n);
  }
  return sections;
}

function NotificationCard({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  const d = new Date(item.createdAt);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
    >
      <GlassCard angle={CARD_ANGLE} style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        {!Number.isNaN(d.getTime()) && <Text style={styles.time}>{formatTime(d)}</Text>}
      </GlassCard>
    </Pressable>
  );
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const [extra, setExtra] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());

  const first = useApi(async () => {
    const res = await listNotifications(1, PAGE_SIZE);
    setUnreadCount(res.unreadCount);
    setExtra([]);
    setPage(1);
    return res;
  }, []);

  const totalPages = first.data?.pagination.totalPages ?? 1;
  const items = [...(first.data?.notifications ?? []), ...extra]
    .filter((n, i, all) => all.findIndex(o => o.id === n.id) === i)
    .map(n => (readIds.has(n.id) ? { ...n, read: true } : n));

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listNotifications(page + 1, PAGE_SIZE);
      setExtra(prev => [...prev, ...res.notifications]);
      setPage(page + 1);
      setUnreadCount(res.unreadCount);
    } catch {
      // keep what is shown; the user can try again
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page]);

  const open = useCallback((n: AppNotification) => {
    if (!n.read) {
      setReadIds(prev => new Set(prev).add(n.id));
      markNotificationRead(n.id)
        .then(setUnreadCount)
        .catch(() => {});
    }
    // no screen: the user is already on the Notification screen
    if (n.screen && n.screen.toLowerCase() !== 'notification') openNotificationTarget(n.screen);
  }, []);

  const sections = groupByDay(items);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader title="Notification" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={first.refreshing}
            onRefresh={first.refresh}
            tintColor={colors.primary}
            colors={[colors.onPrimary]}
            progressBackgroundColor={colors.primary}
          />
        }
      >
        {first.loading ? (
          <LoadingView />
        ) : first.error && !first.data ? (
          <ErrorCard error={first.error} onRetry={first.reload} />
        ) : sections.length === 0 ? (
          <Text style={styles.empty}>No notifications yet</Text>
        ) : (
          <>
            {sections.map(s => (
              <View key={s.key} style={styles.section}>
                <Text style={styles.sectionTitle}>{s.title}</Text>
                {s.items.map(n => (
                  <NotificationCard key={n.id} item={n} onPress={() => open(n)} />
                ))}
              </View>
            ))}
            {page < totalPages &&
              (loadingMore ? (
                <LoadingView />
              ) : (
                <View style={styles.more}>
                  <PillButton label="Load more" onPress={loadMore} />
                </View>
              ))}
          </>
        )}
      </ScrollView>
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
    // Header divider ends at y = 115, the first section starts at y = 139
    paddingTop: 23,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  card: {
    padding: 15,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    backgroundColor: colors.primary,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  more: {
    alignItems: 'center',
  },
});
