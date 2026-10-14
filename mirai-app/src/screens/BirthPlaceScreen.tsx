import React, { useState } from 'react';
import { Image, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import GlassCard from '../components/GlassCard';
import Button, { ButtonRow } from '../components/Button';
import { useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { colors, DESIGN_WIDTH, fonts } from '../theme';

const placeArt = require('../assets/images/place-of-birth.png');

type Props = NativeStackScreenProps<RootStackParamList, 'BirthPlace'>;

export default function BirthPlaceScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const { data, update } = useOnboarding();
  const [city, setCity] = useState(data.birthPlace ?? '');

  const { saving, save } = useStepSaver();

  const onNext = () => {
    const value = city.trim();
    if (!value) return;
    // The backend geocodes the place name when an astrology endpoint first needs coordinates
    update({ birthPlace: value });
    save(4, { birthPlace: value }, () => navigation.navigate('Gender'));
  };

  const onUnknown = () => {
    update({ birthPlace: undefined });
    save(4, {}, () => navigation.navigate('Gender'));
  };

  return (
    // Title and description are copied from the Figma frame as-is
    <OnboardingLayout
      title="Time of birth"
      step={4}
      description="Date is important for determining your sun sign, numerology and compatibility."
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
      <Image
        source={placeArt}
        resizeMode="cover"
        style={[styles.art, { width: 287 * s, height: 287 * s }]}
      />
      <GlassCard angle={115.25} style={styles.field}>
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="Type in city of birth"
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          autoCapitalize="words"
          autoComplete="address-line1"
          textContentType="addressCity"
          returnKeyType="next"
          onSubmitEditing={onNext}
          style={styles.input}
        />
      </GlassCard>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  art: {
    alignSelf: 'center',
    marginTop: 26,
  },
  field: {
    marginTop: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    // Design padding minus the 1px border
    padding: 15,
  },
  input: {
    height: 24,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
});
