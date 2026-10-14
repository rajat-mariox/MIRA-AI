import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../GlassCard';
import ChevronLeft from '../../assets/images/panchang-chevron-left.svg';
import ChevronRight from '../../assets/images/panchang-chevron-right.svg';
import DividerLine from '../../assets/images/divider-line.svg';
import Dot from '../../assets/images/panchang-dot.svg';
import { colors, fonts, MONTHS } from '../../theme';

export type CalendarDate = { year: number; month: number; day: number };

type Props = {
  /** month on screen (month is 0-based) */
  year: number;
  month: number;
  selected: CalendarDate;
  /** days of the visible month that get a small dot (festivals) */
  markedDays?: number[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** also called for the dimmed days of the adjacent months */
  onSelect: (date: CalendarDate) => void;
};

// Shortened like the design ("Thr")
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'];

type Cell = CalendarDate & { inMonth: boolean };

/** Weeks starting on Sunday, padded with the adjacent months' days */
function buildWeeks(year: number, month: number): Cell[][] {
  const lead = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;

  const weeks: Cell[][] = [];
  for (let i = 0; i < total; i++) {
    // Date normalises day 0 / negative / overflowing days into the adjacent months
    const date = new Date(year, month, i - lead + 1);
    const cell = {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(cell);
  }
  return weeks;
}

const pad = (n: number) => String(n).padStart(2, '0');

export default function MonthCalendar({
  year,
  month,
  selected,
  markedDays = [],
  onPrevMonth,
  onNextMonth,
  onSelect,
}: Props) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  return (
    <GlassCard angle={95.08} style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth} hitSlop={12} accessibilityRole="button" accessibilityLabel="Previous month">
          <ChevronLeft width={20} height={20} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable onPress={onNextMonth} hitSlop={12} accessibilityRole="button" accessibilityLabel="Next month">
          <ChevronRight width={20} height={20} />
        </Pressable>
      </View>

      <View style={styles.divider}>
        <DividerLine width="100%" height={1} style={styles.dividerLine} />
      </View>

      <View style={styles.row}>
        {WEEKDAY_LABELS.map(label => (
          <View key={label} style={styles.cell}>
            <Text style={styles.weekday}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map(week => (
        <View key={`${week[0].year}-${week[0].month}-${week[0].day}`} style={styles.row}>
          {week.map(cell => {
            const isSelected =
              cell.year === selected.year && cell.month === selected.month && cell.day === selected.day;
            const marked = cell.inMonth && markedDays.includes(cell.day);
            return (
              <Pressable
                key={`${cell.month}-${cell.day}`}
                onPress={() => onSelect(cell)}
                style={[styles.cell, isSelected && styles.cellSelected, !cell.inMonth && styles.cellDimmed]}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day} ${MONTHS[cell.month]} ${cell.year}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.day, isSelected && styles.daySelected]}>{pad(cell.day)}</Text>
                {marked && <Dot width={5} height={5} />}
              </Pressable>
            );
          })}
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // Design padding 16 / 12 minus the 1px border
  card: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    gap: 4,
    alignItems: 'center',
  },
  header: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthTitle: {
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 27,
    color: colors.white,
    includeFontPadding: false,
  },
  divider: {
    alignSelf: 'stretch',
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: -1,
  },
  // Rows are 307 wide in the design, 2px wider than the card content on each side
  row: {
    alignSelf: 'stretch',
    marginHorizontal: -2,
    height: 35,
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    borderRadius: 99,
    backgroundColor: '#A8D9F2',
  },
  cellDimmed: {
    opacity: 0.4,
  },
  weekday: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  day: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  daySelected: {
    color: colors.black,
  },
});
