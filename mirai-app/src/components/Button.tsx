import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  labelColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Pill button with an outer ring. Primary has a drop shadow and inner highlight.
export default function Button({
  title,
  onPress,
  variant = 'primary',
  labelColor = colors.black,
  disabled,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.ring, style, (pressed || disabled) && styles.dimmed]}
    >
      <View style={[styles.fill, variant === 'primary' ? styles.primary : styles.secondary]}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  ring: {
    padding: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 50,
  },
  fill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 60,
  },
  primary: {
    backgroundColor: colors.primary,
    boxShadow:
      '0px 8px 8px rgba(37, 35, 118, 0.32), inset 0px 2px 6px 0px rgba(240, 240, 255, 0.8)',
  },
  secondary: {
    backgroundColor: colors.primaryHalf,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dimmed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
