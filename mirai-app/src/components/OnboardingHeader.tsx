import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronRight from '../assets/images/icon-chevron-right.svg';
import { colors, DESIGN_STATUS_BAR, fonts } from '../theme';

export const ONBOARDING_STEPS = 6;

type Props = {
  title: string;
  step: number;
  description: string;
  descriptionOpacity?: number;
  onBack: () => void;
};

// Back button + title, 6-step progress bar and a short description
export default function OnboardingHeader({
  title,
  step,
  description,
  descriptionOpacity = 0.6,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR) + 10 }]}>
      <View style={styles.block}>
        <View style={styles.titleRow}>
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backButton}
          >
            <ChevronRight width={20} height={20} style={styles.backIcon} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.progress}>
          {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
            <View key={i} style={[styles.bar, i >= step && styles.barInactive]} />
          ))}
        </View>
      </View>
      <Text style={[styles.description, { color: `rgba(255, 255, 255, ${descriptionOpacity})` }]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  block: {
    gap: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.iconButton,
  },
  backIcon: {
    opacity: 0.8,
    // The design uses chevron-right mirrored horizontally
    transform: [{ scaleX: -1 }],
  },
  title: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 20,
    lineHeight: 24,
    color: colors.white,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
  },
  bar: {
    flex: 1,
    height: 2,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  barInactive: {
    opacity: 0.2,
  },
  description: {
    paddingHorizontal: 20,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
