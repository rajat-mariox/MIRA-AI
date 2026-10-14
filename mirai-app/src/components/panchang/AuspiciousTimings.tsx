import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../GlassCard';
import Chevron from '../../assets/images/panchang-chevron-24.svg';
import ClockIcon from '../../assets/images/icon-clock.svg';
import DividerLine from '../../assets/images/panchang-muhurat-line.svg';
import { colors, fonts } from '../../theme';

export type MuhuratRating = 'highly-auspicious' | 'auspicious' | 'very-good';

export type Muhurat = {
  name: string;
  time: string;
  rating: MuhuratRating;
  recommendedFor: string;
  /** the design puts this badge 12dp after the name instead of at the right edge */
  badgeBesideName?: boolean;
};

const RATINGS: Record<MuhuratRating, { label: string; color: string; background: string }> = {
  'highly-auspicious': { label: 'Highly Auspicious', color: '#05DF72', background: 'rgba(0, 201, 80, 0.2)' },
  auspicious: { label: 'Auspicious', color: '#FF8C1A', background: 'rgba(255, 140, 26, 0.2)' },
  'very-good': { label: 'Very Good', color: colors.badgeText, background: colors.badgeBackground },
};

type Props = {
  title: string;
  items: Muhurat[];
  initiallyOpen?: boolean;
};

/** Collapsible card listing the muhurats; the chevron points up while open */
export default function AuspiciousTimings({ title, items, initiallyOpen = true }: Props) {
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(v => !v);
  };

  return (
    <GlassCard angle={92.86} style={[styles.card, !open && styles.cardCollapsed]}>
      <Pressable
        onPress={toggle}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Chevron width={24} height={24} style={{ transform: [{ rotate: open ? '-90deg' : '90deg' }] }} />
      </Pressable>
      {open && (
        <View style={styles.items}>
          {items.map(item => (
            <MuhuratCard key={item.name} {...item} />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function MuhuratCard({ name, time, rating, recommendedFor, badgeBesideName }: Muhurat) {
  const badge = RATINGS[rating];

  return (
    <GlassCard angle={99.78} style={styles.muhurat}>
      <View style={[styles.muhuratTop, badgeBesideName && styles.muhuratTopStart]}>
        <View style={styles.muhuratHeading}>
          <Text style={styles.muhuratName} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.timeRow}>
            <ClockIcon width={16} height={16} />
            <Text style={styles.time}>{time}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.background }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      <View style={styles.divider}>
        <DividerLine width="100%" height={1} style={styles.dividerLine} />
      </View>
      <View style={styles.recommended}>
        <Text style={styles.recommendedLabel}>Recommended for:</Text>
        <Text style={styles.recommendedValue}>{recommendedFor}</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // Design paddings minus the 1px border
  card: {
    paddingTop: 15,
    gap: 16,
  },
  cardCollapsed: {
    paddingBottom: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.18,
    color: colors.white,
    includeFontPadding: false,
  },
  items: {
    gap: 10,
    paddingHorizontal: 9,
    paddingTop: 10,
    paddingBottom: 9,
  },
  muhurat: {
    padding: 15,
    gap: 12,
  },
  muhuratTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  muhuratTopStart: {
    justifyContent: 'flex-start',
  },
  muhuratHeading: {
    gap: 6,
    flexShrink: 1,
  },
  muhuratName: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.16,
    color: colors.white,
    includeFontPadding: false,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 16,
    includeFontPadding: false,
  },
  divider: {
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: -1,
  },
  recommended: {
    gap: 4,
  },
  recommendedLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  recommendedValue: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.white,
    includeFontPadding: false,
  },
});
