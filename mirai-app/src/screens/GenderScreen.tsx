import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import OptionCard from '../components/OptionCard';
import Button, { ButtonRow } from '../components/Button';
import UserHexagon from '../assets/images/user-hexagon.svg';
import GenderMale from '../assets/images/icon-gender-male.svg';
import GenderFemale from '../assets/images/icon-gender-female.svg';
import TargetIcon from '../assets/images/icon-target.svg';
import { Gender, useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { DESIGN_WIDTH } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Gender'>;

export default function GenderScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const { data, update } = useOnboarding();
  const [gender, setGender] = useState<Gender>(data.gender ?? 'male');

  const { saving, save } = useStepSaver();

  const next = (value?: Gender) => {
    update({ gender: value });
    save(5, value ? { gender: value } : {}, () => navigation.navigate('Relationship'));
  };

  return (
    <OnboardingLayout
      title="add Gender"
      step={5}
      description="It will reveal the balance of your masculine and feminine energy."
      footer={
        <ButtonRow>
          <Button
            title="Skip"
            variant="secondary"
            onPress={() => next(undefined)}
            disabled={saving}
            style={styles.flex}
          />
          <Button title="Next" onPress={() => next(gender)} disabled={saving} style={styles.flex} />
        </ButtonRow>
      }
    >
      {/* 255×255 slot with the SVG placed where Figma puts it inside the slot */}
      <View style={[styles.artSlot, { width: 255 * s, height: 255 * s }]}>
        <UserHexagon
          width={232.813 * s}
          height={254.059 * s}
          style={[styles.abs, { left: 11.08 * s, top: 8.48 * s }]}
        />
      </View>

      <View style={styles.options}>
        <View style={styles.row}>
          <OptionCard
            label="Male"
            Icon={GenderMale}
            iconSize={{ width: 32, height: 32 }}
            slotSize={32}
            layout="stacked"
            angle={97.88}
            selected={gender === 'male'}
            onPress={() => setGender('male')}
          />
          <OptionCard
            label="Female"
            Icon={GenderFemale}
            iconSize={{ width: 32, height: 32 }}
            slotSize={32}
            layout="stacked"
            angle={97.88}
            selected={gender === 'female'}
            onPress={() => setGender('female')}
          />
        </View>
        <View style={styles.row}>
          <OptionCard
            label="Other"
            Icon={TargetIcon}
            iconSize={{ width: 19.5, height: 19.5 }}
            slotSize={24}
            layout="inline"
            angle={115.25}
            selected={gender === 'other'}
            onPress={() => setGender('other')}
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
  artSlot: {
    alignSelf: 'center',
    marginTop: 26,
    overflow: 'hidden',
  },
  options: {
    marginTop: 37,
    marginBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
