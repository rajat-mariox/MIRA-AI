import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import GlassCard from './GlassCard';
import { errorMessage, isAstrologyUnavailable } from '../api/client';
import { colors, fonts } from '../theme';

/** Centred spinner in the primary colour, for sections that are loading. */
export function LoadingView({ style, size = 'small' }: { style?: StyleProp<ViewStyle>; size?: 'small' | 'large' }) {
  return (
    <View style={[styles.loading, style]} accessibilityLabel="Loading">
      <ActivityIndicator color={colors.primary} size={size} />
    </View>
  );
}

type ErrorCardProps = {
  error: unknown;
  onRetry?: () => void;
  /** overrides the default title */
  title?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Glass card with a short title, the server message and a Retry pill. Astrology services
 * (502 / 503) get the "unavailable right now" title.
 */
export function ErrorCard({ error, onRetry, title, style }: ErrorCardProps) {
  const heading =
    title ?? (isAstrologyUnavailable(error) ? 'Astrology data is unavailable right now' : 'Something went wrong');
  return (
    <GlassCard angle={100.39} style={[styles.card, style]}>
      <Text style={styles.title}>{heading}</Text>
      <Text style={styles.message}>{errorMessage(error)}</Text>
      {onRetry && <PillButton label="Retry" onPress={onRetry} />}
    </GlassCard>
  );
}

/** Same card for non-error notices (empty data, profile incomplete). */
export function InfoCard({
  title,
  message,
  action,
  style,
}: {
  title: string;
  message?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <GlassCard angle={100.39} style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {action && <PillButton label={action.label} onPress={action.onPress} />}
    </GlassCard>
  );
}

/** Small primary pill (the Home banner's "View Today" button). */
export function PillButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [styles.pill, (pressed || disabled) && styles.pressed]}
    >
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export function EmptyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Card paddings are the design value minus the 1px border
  card: {
    padding: 15,
    gap: 8,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    includeFontPadding: false,
  },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.black,
    includeFontPadding: false,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    includeFontPadding: false,
  },
});
