import React from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import GlassCard from '../GlassCard';
import { MENU_CARD_ANGLE } from './MenuRow';
import { colors, fonts } from '../../theme';

// Field values and placeholders are 60% white in the design
const FIELD_TEXT_COLOR = 'rgba(255, 255, 255, 0.6)';

type Props = {
  label: string;
  children: React.ReactNode;
  /** makes the whole box tappable (date / picker fields) */
  onPress?: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

// Label + 48dp glass box used by the Edit Profile form
export default function ProfileField({ label, children, onPress, onLayout }: Props) {
  const box = (
    <GlassCard angle={MENU_CARD_ANGLE} style={styles.box}>
      {children}
    </GlassCard>
  );
  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
          {box}
        </Pressable>
      ) : (
        box
      )}
    </View>
  );
}

// Text input styled like the field values in the design (16/24, 60% white)
export function ProfileInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={FIELD_TEXT_COLOR}
      selectionColor={colors.primary}
      style={[fieldText.value, styles.input, style]}
      {...props}
    />
  );
}

export const fieldText = StyleSheet.create({
  value: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIELD_TEXT_COLOR,
    includeFontPadding: false,
  },
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    // Figma: 12 / 16 padding with the 1dp stroke inside the 48dp box
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 24,
    padding: 0,
    textAlignVertical: 'center',
  },
});
