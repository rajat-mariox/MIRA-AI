import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WheelPicker, { WheelProfile } from '../WheelPicker';
import { colors, fonts, MONTHS } from '../../theme';

export type BirthDate = { day: number; month: number; year: number };
export type BirthTime = { hour: number; minute: number; period: 'AM' | 'PM' };

export const DEFAULT_BIRTH_DATE: BirthDate = { day: 1, month: 0, year: 2000 };
export const DEFAULT_BIRTH_TIME: BirthTime = { hour: 12, minute: 0, period: 'PM' };

const FIRST_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => String(FIRST_YEAR + i));
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;

// Same wheel look as the onboarding / Edit Profile date picker
const SMALL = 22 / 24;
const WHEEL_PROFILE: WheelProfile = {
  offsets: [0, 31.7, 58, 78, 87],
  scaleX: [1, SMALL, SMALL, SMALL, SMALL],
  scaleY: [1, 0.9 * SMALL, 0.72 * SMALL, 0.5 * SMALL, 0.15 * SMALL],
  opacity: [1, 0.6, 0.5, 0.4, 0.3],
};
const WHEEL_HEIGHT = 178;
const ROW_HEIGHT = 32;

const pad = (n: number) => String(n).padStart(2, '0');
export const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
export const formatBirthDate = ({ day, month, year }: BirthDate) => `${day} ${MONTHS[month]} ${year}`;
export const formatBirthTime = ({ hour, minute, period }: BirthTime) => `${hour}:${pad(minute)} ${period}`;
/** Clamps the day to the month's length (e.g. 31 Feb -> 28/29 Feb). */
export const clampBirthDate = (d: BirthDate): BirthDate => ({ ...d, day: Math.min(d.day, daysInMonth(d.month, d.year)) });

/** Day / month / year wheels for a PickerSheet. */
export function DateWheels({ value, onChange }: { value: BirthDate; onChange: (fn: (d: BirthDate) => BirthDate) => void }) {
  const dayCount = daysInMonth(value.month, value.year);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => String(i + 1)), [dayCount]);
  const day = Math.min(value.day, dayCount);
  return (
    <View style={styles.wheels}>
      <View style={styles.selection} />
      <WheelPicker
        items={days}
        selectedIndex={day - 1}
        onChange={i => onChange(d => ({ ...d, day: i + 1 }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={styles.wheelText}
        align="left"
        style={styles.dayColumn}
        accessibilityLabel="Day"
      />
      <WheelPicker
        items={MONTHS}
        selectedIndex={value.month}
        onChange={i => onChange(d => ({ ...d, month: i }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={styles.wheelText}
        style={styles.monthColumn}
        accessibilityLabel="Month"
        loop
      />
      <WheelPicker
        items={YEARS}
        selectedIndex={value.year - FIRST_YEAR}
        onChange={i => onChange(d => ({ ...d, year: FIRST_YEAR + i }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={styles.wheelText}
        align="right"
        style={styles.yearColumn}
        accessibilityLabel="Year"
      />
    </View>
  );
}

/** Hour : minute AM/PM wheels for a PickerSheet. */
export function TimeWheels({ value, onChange }: { value: BirthTime; onChange: (fn: (t: BirthTime) => BirthTime) => void }) {
  return (
    <View style={styles.wheels}>
      <View style={styles.selection} />
      <WheelPicker
        items={HOURS}
        selectedIndex={value.hour - 1}
        onChange={i => onChange(t => ({ ...t, hour: i + 1 }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={[styles.wheelText, styles.center]}
        style={styles.hourColumn}
        accessibilityLabel="Hour"
        loop
      />
      <Text style={styles.colon}>:</Text>
      <WheelPicker
        items={MINUTES}
        selectedIndex={value.minute}
        onChange={i => onChange(t => ({ ...t, minute: i }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={[styles.wheelText, styles.center]}
        style={styles.minuteColumn}
        accessibilityLabel="Minute"
        loop
      />
      <WheelPicker
        items={[...PERIODS]}
        selectedIndex={PERIODS.indexOf(value.period)}
        onChange={i => onChange(t => ({ ...t, period: PERIODS[i] }))}
        profile={WHEEL_PROFILE}
        height={WHEEL_HEIGHT}
        rowHeight={ROW_HEIGHT}
        textStyle={[styles.wheelText, styles.center]}
        style={styles.periodColumn}
        accessibilityLabel="AM or PM"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wheels: {
    alignSelf: 'center',
    width: 297,
    height: WHEEL_HEIGHT,
  },
  selection: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_HEIGHT / 2 - 18,
    height: 36,
    borderRadius: 7,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  wheelText: {
    // Poppins sits 2dp lower in its line box than in Figma (see BirthDateScreen)
    top: -2,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
  },
  center: {
    textAlign: 'center',
  },
  dayColumn: {
    position: 'absolute',
    left: 16,
    width: 50,
  },
  monthColumn: {
    position: 'absolute',
    left: 69.5,
    width: 140,
  },
  yearColumn: {
    position: 'absolute',
    left: 211,
    width: 70,
  },
  hourColumn: {
    position: 'absolute',
    left: 40,
    width: 50,
  },
  colon: {
    position: 'absolute',
    left: 102,
    top: WHEEL_HEIGHT / 2 - 20,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
  },
  minuteColumn: {
    position: 'absolute',
    left: 121,
    width: 60,
  },
  periodColumn: {
    position: 'absolute',
    left: 190,
    width: 70,
  },
});
