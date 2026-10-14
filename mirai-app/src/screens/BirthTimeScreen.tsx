import React, { useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import Button, { ButtonRow } from '../components/Button';
import WheelPicker, { WheelProfile } from '../components/WheelPicker';
import { birthTimeTo24h, useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { colors, DESIGN_WIDTH, fonts } from '../theme';

const timeArt = require('../assets/images/time-of-birth.png');

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'] as const;

// Rows get smaller (24 → 20 → 17 → 12 → 6.5px) and lighter (#C8C8C8 at 80/60/40/20%).
// The grey is folded into the opacity so the wheel can run on the native driver.
const GREY = 0.71;
const TIME_PROFILE: WheelProfile = {
  offsets: [0, 30.5, 56, 74.5, 86],
  scaleX: [1, 20 / 24, 17 / 24, 12 / 24, 6.5 / 24],
  scaleY: [1, 20 / 24, 17 / 24, 12 / 24, 6.5 / 24],
  opacity: [1, 0.8 * GREY, 0.6 * GREY, 0.4 * GREY, 0.25 * GREY],
};
const WHEEL_HEIGHT = 179;
const UNKNOWN_BIRTH_TIME = '12:00';
const ROW_HEIGHT = 31;

type Props = NativeStackScreenProps<RootStackParamList, 'BirthTime'>;

export default function BirthTimeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const { data, update } = useOnboarding();

  // The design shows 5:41 AM selected
  const initial = data.birthTime ?? { hour: 5, minute: 41, period: 'AM' as const };
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);

  const { saving, save } = useStepSaver();

  const onNext = () => {
    const birthTime = { hour, minute, period };
    update({ birthTime });
    save(3, { birthTime: birthTimeTo24h(birthTime) }, () => navigation.navigate('BirthPlace'));
  };

  // "I don't know": the kundli needs a time, so noon (12:00) is stored as the usual
  // default for unknown birth times; the user can correct it later.
  const onUnknown = () => {
    update({ birthTime: undefined });
    save(3, { birthTime: UNKNOWN_BIRTH_TIME }, () => navigation.navigate('BirthPlace'));
  };

  return (
    <OnboardingLayout
      title="Time of birth"
      step={3}
      description="Time is important for determining your houses, rising sign, and exact moon position."
      footer={
        <ButtonRow>
          <Button
            title="I don’t know"
            variant="secondary"
            onPress={onUnknown}
            disabled={saving}
            style={styles.flex}
          />
          <Button title="Next" onPress={onNext} disabled={saving} style={styles.flex} />
        </ButtonRow>
      }
    >
      <View style={[styles.artSlot, { width: 300 * s, height: 300 * s }]}>
        <Image source={timeArt} resizeMode="cover" style={{ width: 346 * s, height: 346 * s }} />
      </View>

      <View style={styles.picker}>
        <View style={styles.selection} />
        <WheelPicker
          items={HOURS}
          selectedIndex={hour - 1}
          onChange={i => setHour(i + 1)}
          profile={TIME_PROFILE}
          height={WHEEL_HEIGHT}
          rowHeight={ROW_HEIGHT}
          textStyle={styles.wheelText}
          style={styles.hourColumn}
          accessibilityLabel="Hour"
            loop
        />
        <Text style={styles.colon}>:</Text>
        <WheelPicker
          items={MINUTES}
          selectedIndex={minute}
          onChange={setMinute}
          profile={TIME_PROFILE}
          height={WHEEL_HEIGHT}
          rowHeight={ROW_HEIGHT}
          textStyle={styles.wheelText}
          style={styles.minuteColumn}
          accessibilityLabel="Minute"
            loop
        />
        <WheelPicker
          items={[...PERIODS]}
          selectedIndex={PERIODS.indexOf(period)}
          onChange={i => setPeriod(PERIODS[i])}
          profile={TIME_PROFILE}
          height={WHEEL_HEIGHT}
          rowHeight={ROW_HEIGHT}
          textStyle={styles.wheelText}
          style={styles.periodColumn}
          accessibilityLabel="AM or PM"
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  artSlot: {
    alignSelf: 'center',
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  picker: {
    alignSelf: 'center',
    width: 297,
    height: WHEEL_HEIGHT,
    marginTop: 25,
    marginBottom: 25,
  },
  selection: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 73,
    height: 34,
    borderRadius: 7,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  wheelText: {
    // Measured on device: Poppins sits 4dp lower in its line box than in Figma
    top: -4,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  colon: {
    position: 'absolute',
    left: 102,
    // 73 in Figma (SF Pro); Poppins' colon sits 2dp lower, measured on device
    top: 71,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
  },
  hourColumn: {
    position: 'absolute',
    left: 40,
    width: 50,
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
