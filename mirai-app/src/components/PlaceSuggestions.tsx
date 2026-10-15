import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from './GlassCard';
import type { PlaceSuggestion } from '../api/places';
import { colors, fonts } from '../theme';

type Props = {
  suggestions: PlaceSuggestion[];
  loading?: boolean;
  onPick: (s: PlaceSuggestion) => void;
};

/** Dropdown of city suggestions shown under a birth place field */
export default function PlaceSuggestions({ suggestions, loading, onPick }: Props) {
  if (!suggestions.length) {
    return loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null;
  }
  return (
    <GlassCard angle={115.25} style={styles.card}>
      {suggestions.map((s, i) => (
        <Pressable
          key={s.placeId}
          onPress={() => onPick(s)}
          style={({ pressed }) => [styles.row, i > 0 && styles.divider, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={s.description || s.name}
        >
          <Text style={styles.name} numberOfLines={1}>
            {s.name}
          </Text>
          {!!s.region && (
            <Text style={styles.region} numberOfLines={1}>
              {s.region}
            </Text>
          )}
        </Pressable>
      ))}
      <View style={styles.footer}>
        <Text style={styles.powered}>powered by Google</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 4,
  },
  row: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 2,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  pressed: {
    backgroundColor: 'rgba(167, 216, 242, 0.12)',
  },
  name: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  region: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  footer: {
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 6,
    paddingTop: 2,
  },
  powered: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  spinner: {
    marginTop: 8,
  },
});
