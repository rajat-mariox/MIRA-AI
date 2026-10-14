import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import OnboardingLayout from '../components/OnboardingLayout';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Name'>;

export default function NameScreen({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.name);
  const { saving, save } = useStepSaver();

  const onNext = () => {
    const value = name.trim();
    if (!value) return;
    update({ name: value });
    save(1, { fullName: value }, () => navigation.navigate('BirthDate'));
  };

  return (
    <OnboardingLayout
      title="enter the name"
      step={1}
      description="To make your journey more insightful, let’s get to know you better."
      descriptionOpacity={0.8}
      footer={
        <>
          <GlassCard angle={117.84} borderColor="rgba(255, 255, 255, 0.8)" style={styles.field}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter Name"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.primary}
              autoFocus
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={onNext}
              style={styles.input}
            />
          </GlassCard>
          <Button title="Next" onPress={onNext} disabled={saving} style={styles.button} />
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  // Design padding minus the 1px border
  field: {
    paddingHorizontal: 19,
    paddingVertical: 15,
  },
  input: {
    height: 18,
    padding: 0,
    fontFamily: fonts.nunitoMedium,
    fontSize: 16,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  button: {
    marginTop: 17,
  },
});
