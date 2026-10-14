import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../GlassCard';
import ChevronRight from '../../assets/images/icon-chevron-right.svg';
import { colors, fonts, MONTHS, WEEKDAYS } from '../../theme';

export type Festival = {
  /** day of the month (calendar markers) */
  day: number;
  name: string;
  /** YYYY-MM-DD */
  date: string;
};

/** Local midnight of a YYYY-MM-DD date */
export const parseFestivalDate = (date: string) => new Date(`${date.slice(0, 10)}T00:00:00`);

/** Whole days from today (local) to the date: 0 = today, negative = past */
export function daysUntil(date: string, now = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseFestivalDate(date).getTime() - today.getTime()) / 86_400_000);
}

/** "Sunday, 8 Nov" */
export function festivalDateLabel(date: string, longMonth = false): string {
  const d = parseFestivalDate(date);
  const month = MONTHS[d.getMonth()];
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${longMonth ? month : month.slice(0, 3)}`;
}

/**
 * Compact festival row (~64dp): month/day tile, name + weekday/date with a "Today" /
 * "In N days" chip, and a chevron. Past festivals are dimmed.
 */
export default function FestivalCard({ name, date, onPress }: Festival & { onPress?: () => void }) {
  const d = parseFestivalDate(date);
  const inDays = daysUntil(date);
  const chip = inDays === 0 ? 'Today' : inDays === 1 ? 'Tomorrow' : inDays > 1 && inDays <= 7 ? `In ${inDays} days` : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${festivalDateLabel(date, true)}${chip ? `, ${chip}` : ''}`}
      style={({ pressed }) => [inDays < 0 && styles.past, pressed && styles.pressed]}
    >
      <GlassCard angle={105.08} style={styles.card}>
        <View style={styles.tile}>
          <Text style={styles.month}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
          <Text style={styles.day}>{d.getDate()}</Text>
        </View>
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              {festivalDateLabel(date)}
            </Text>
            {chip && (
              <View style={[styles.chip, inDays === 0 && styles.chipToday]}>
                <Text style={[styles.chipText, inDays === 0 && styles.chipTextToday]}>{chip}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight width={18} height={18} style={styles.chevron} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // 10 + the 1px border = 11 around a 46dp tile -> 68dp row
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  past: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  month: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1,
    color: colors.primary,
    includeFontPadding: false,
  },
  day: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.white,
    includeFontPadding: false,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meta: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(167, 216, 242, 0.12)',
  },
  chipToday: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.primary,
    includeFontPadding: false,
  },
  chipTextToday: {
    color: colors.onPrimary,
  },
  chevron: {
    opacity: 0.7,
  },
});
