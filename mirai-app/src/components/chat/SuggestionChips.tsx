import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { fonts } from '../../theme';

type Props = {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
};

const CHIP_BORDER = 0.636;

// Horizontally scrolling row of quick questions shown above the chat input
export default function SuggestionChips({ suggestions, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}
    >
      {suggestions.map(suggestion => (
        <Pressable
          key={suggestion}
          onPress={() => onSelect(suggestion)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
        >
          <Text style={styles.label} numberOfLines={1}>
            {suggestion}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    // 7 / 8 in the design minus the border
    paddingHorizontal: 7 - CHIP_BORDER,
    paddingVertical: 8 - CHIP_BORDER,
    borderWidth: CHIP_BORDER,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
