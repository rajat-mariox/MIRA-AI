import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import Button, { ButtonRow } from '../components/Button';
import WheelPicker, { WheelProfile } from '../components/WheelPicker';
import { birthDateToIso, useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { colors, DESIGN_WIDTH, fonts, MONTHS } from '../theme';

const zodiacRing = require('../assets/images/zodiac-ring.png');
const zodiacCancer = require('../assets/images/zodiac-cancer.png');


const FIRST_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

// Rows shrink vertically and fade towards the edges, as in the Figma picker
const SMALL = 22 / 24;
const DATE_PROFILE: WheelProfile = {
  offsets: [0, 31.7, 58, 78, 87],
  scaleX: [1, SMALL, SMALL, SMALL, SMALL],
  scaleY: [1, 0.9 * SMALL, 0.72 * SMALL, 0.5 * SMALL, 0.15 * SMALL],
  opacity: [1, 0.6, 0.5, 0.4, 0.3],
};
const WHEEL_HEIGHT = 178;
const ROW_HEIGHT = 32;

// Distance from the bottom of the header to the date picker in the design
const ART_HEIGHT = 289;

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

type Props = NativeStackScreenProps<RootStackParamList, 'BirthDate'>;

export default function BirthDateScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const { data, update } = useOnboarding();

  // The design shows 20 January 2023 selected
  const initial = data.birthDate ?? { day: 20, month: 0, year: Math.min(2023, CURRENT_YEAR) };
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const dayCount = daysInMonth(month, year);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => String(i + 1)), [dayCount]);
  const safeDay = Math.min(day, dayCount);

  const { saving, save } = useStepSaver();

  const onNext = () => {
    const birthDate = { day: safeDay, month, year };
    update({ birthDate });
    save(2, { dateOfBirth: birthDateToIso(birthDate) }, () => navigation.navigate('BirthTime'));
  };

  const onSkip = () => save(2, {}, () => navigation.navigate('BirthTime'));

  return (
    <OnboardingLayout
      title="Date of birth"
      step={2}
      description="Date is important for determining your sun sign, numerology and compatibility."
      footer={
        <ButtonRow>
          <Button
            title="Skip"
            variant="secondary"
            onPress={onSkip}
            disabled={saving}
            style={styles.flex}
          />
          <Button title="Next" onPress={onNext} disabled={saving} style={styles.flex} />
        </ButtonRow>
      }
    >
      <View style={{ height: ART_HEIGHT * s }}>
        <Image
          source={zodiacRing}
          resizeMode="cover"
          style={[styles.abs, styles.ring, { left: -10 * s, width: 395 * s, height: 319 * s }]}
        />
        {/* The design stacks two copies of the sign, slightly offset */}
        <Image
          source={zodiacCancer}
          resizeMode="cover"
          style={[
            styles.abs,
            styles.sign,
            {
              left: (DESIGN_WIDTH / 2 + 0.17 - 61.667) * s,
              top: 98 * s,
              width: 123.333 * s,
              height: 123.333 * s,
              borderRadius: 61.667 * s,
            },
          ]}
        />
        <Image
          source={zodiacCancer}
          resizeMode="cover"
          style={[
            styles.abs,
            styles.sign,
            {
              left: (DESIGN_WIDTH / 2 + 0.5 - 61.667) * s,
              top: 101.33 * s,
              width: 123.333 * s,
              height: 123.333 * s,
              borderRadius: 61.667 * s,
            },
          ]}
        />
      </View>

      <View style={styles.picker}>
        <View style={styles.wheels}>
          <View style={styles.selection} />
          <WheelPicker
            items={days}
            selectedIndex={safeDay - 1}
            onChange={i => setDay(i + 1)}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            align="left"
            style={styles.dayColumn}
            accessibilityLabel="Day"
          />
          <WheelPicker
            items={MONTHS}
            selectedIndex={month}
            onChange={setMonth}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            style={styles.monthColumn}
            accessibilityLabel="Month"
            loop
          />
          <WheelPicker
            items={YEARS.map(String)}
            selectedIndex={year - FIRST_YEAR}
            onChange={i => setYear(FIRST_YEAR + i)}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            align="right"
            style={styles.yearColumn}
            accessibilityLabel="Year"
          />
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  abs: {
    position: 'absolute',
  },
  ring: {
    top: 0,
  },
  sign: {
    overflow: 'hidden',
  },
  picker: {
    alignSelf: 'center',
    width: 329,
    height: 214,
    borderRadius: 13,
    paddingTop: 18,
    alignItems: 'center',
  },
  wheels: {
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
    // Measured on device: Poppins sits 2dp lower in its line box than in Figma
    top: -2,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
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
});
