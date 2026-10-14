import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import GlassCard from './GlassCard';
import { cardGradients, colors, fonts } from '../theme';

type Props = {
  label: string;
  Icon: React.FC<SvgProps>;
  /** natural size of the SVG */
  iconSize: { width: number; height: number };
  /** size of the icon slot; the SVG is centered in it */
  slotSize: number;
  layout: 'stacked' | 'inline';
  /** space between icon and label in the inline layout */
  inlineGap?: number;
  angle: number;
  selected: boolean;
  onPress: () => void;
};

// Selectable card used for gender and relationship status
export default function OptionCard({
  label,
  Icon,
  iconSize,
  slotSize,
  layout,
  inlineGap = 4,
  angle,
  selected,
  onPress,
}: Props) {
  const dim = selected ? undefined : styles.dim;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={styles.pressable}
    >
      <GlassCard
        angle={angle}
        stops={selected ? cardGradients.selected : cardGradients.idle}
        borderColor={selected ? colors.primary : colors.cardBorder}
        style={layout === 'stacked' ? styles.stacked : [styles.inline, { gap: inlineGap }]}
      >
        <View style={[{ width: slotSize, height: slotSize }, styles.slot, dim]}>
          <Icon width={iconSize.width} height={iconSize.height} />
        </View>
        <Text style={[styles.label, layout === 'inline' && styles.inlineLabel, dim]}>{label}</Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  // 15 + 1px border = Figma's 16px padding (Figma strokes don't add size)
  stacked: {
    padding: 15,
    gap: 4,
  },
  inline: {
    height: 56,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  inlineLabel: {
    flex: 1,
  },
  dim: {
    opacity: 0.6,
  },
});
