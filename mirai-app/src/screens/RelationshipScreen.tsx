import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SvgProps } from 'react-native-svg';
import OnboardingLayout from '../components/OnboardingLayout';
import OptionCard from '../components/OptionCard';
import Button, { ButtonRow } from '../components/Button';
import RelationshipArt from '../assets/images/relationship-art.svg';
import UserHeart from '../assets/images/icon-user-heart.svg';
import UserIcon from '../assets/images/icon-user.svg';
import UsersIcon from '../assets/images/icon-users.svg';
import UserCheck from '../assets/images/icon-user-check.svg';
import UserPause from '../assets/images/icon-user-pause.svg';
import UserSquare from '../assets/images/icon-user-square.svg';
import { relationshipToApi, RelationshipStatus, useOnboarding } from '../context/OnboardingContext';
import useStepSaver from '../hooks/useStepSaver';

import type { RootStackParamList } from '../navigation/types';
import { DESIGN_WIDTH } from '../theme';

type Option = { value: RelationshipStatus; label: string; Icon: React.FC<SvgProps> };

// First row uses large stacked cards, the rest are compact inline cards
const LARGE: Option[] = [
  { value: 'in-relationship', label: 'In a relationship', Icon: UserHeart },
  { value: 'single', label: 'Single', Icon: UserIcon },
];
const COMPACT: Option[][] = [
  [
    { value: 'married', label: 'Married', Icon: UsersIcon },
    { value: 'engaged', label: 'Engaged', Icon: UserCheck },
  ],
  [
    { value: 'divorced', label: 'Divorced', Icon: UserPause },
    { value: 'widow', label: 'Widow', Icon: UserSquare },
  ],
];

type Props = NativeStackScreenProps<RootStackParamList, 'Relationship'>;

export default function RelationshipScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const { data, update } = useOnboarding();
  const [status, setStatus] = useState<RelationshipStatus>(data.relationship ?? 'in-relationship');

  const { saving, save } = useStepSaver();

  // Last step: marks the profile complete
  const finish = (value?: RelationshipStatus) => {
    update({ relationship: value });
    save(
      6,
      { ...(value ? { maritalStatus: relationshipToApi(value) } : {}), isProfileComplete: true },
      () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }),
    );
  };

  return (
    // Description is copied from the Figma frame as-is
    <OnboardingLayout
      title="Relationship status"
      step={6}
      description="It will reveal the balance of your masculine and feminine energy."
      footer={
        <ButtonRow>
          <Button
            title="Skip"
            variant="secondary"
            onPress={() => finish(undefined)}
            disabled={saving}
            style={styles.flex}
          />
          <Button title="Next" onPress={() => finish(status)} disabled={saving} style={styles.flex} />
        </ButtonRow>
      }
    >
      <RelationshipArt width={255 * s} height={255 * s} style={styles.art} />

      <View style={styles.options}>
        <View style={styles.row}>
          {LARGE.map(o => (
            <OptionCard
              key={o.value}
              label={o.label}
              Icon={o.Icon}
              iconSize={{ width: 32, height: 32 }}
              slotSize={32}
              layout="stacked"
              angle={97.88}
              selected={status === o.value}
              onPress={() => setStatus(o.value)}
            />
          ))}
        </View>
        {COMPACT.map(row => (
          <View key={row[0].value} style={styles.row}>
            {row.map(o => (
              <OptionCard
                key={o.value}
                label={o.label}
                Icon={o.Icon}
                iconSize={{ width: 24, height: 24 }}
                slotSize={24}
                layout="inline"
                inlineGap={8}
                angle={102.81}
                selected={status === o.value}
                onPress={() => setStatus(o.value)}
              />
            ))}
          </View>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  art: {
    alignSelf: 'center',
    marginTop: 5,
  },
  options: {
    marginTop: 15,
    marginBottom: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
