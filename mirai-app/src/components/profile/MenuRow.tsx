import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../GlassCard';
import ChevronRight from '../../assets/images/profile-chevron-right.svg';
import { colors, fonts } from '../../theme';

// Fill angle of the menu cards in the Profile / Edit Profile frames
export const MENU_CARD_ANGLE = 118.82003664509132;

type Props = {
  label: string;
  icon: React.ReactNode;
  /** gap between icon and label: 12 for the 20dp icons, 10 for the 18dp globe */
  iconGap?: number;
  /** replaces the default chevron on the right */
  trailing?: React.ReactNode;
  onPress?: () => void;
};

// 48dp high glass card with an icon, a label and a chevron (Profile menu)
export default function MenuRow({ label, icon, iconGap = 12, trailing, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard angle={MENU_CARD_ANGLE} style={styles.card}>
        <View style={[styles.lead, { gap: iconGap }]}>
          {icon}
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
        {trailing ?? <ChevronRight width={24} height={24} />}
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Figma: 12 / 16 padding with the 1dp stroke inside the box
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  label: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
  },
});
