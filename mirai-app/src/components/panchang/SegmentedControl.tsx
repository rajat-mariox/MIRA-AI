import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import GlassCard from '../GlassCard';
import { colors, fonts } from '../../theme';

export type Segment<K extends string> = {
  key: K;
  label: string;
  /** icon drawn on the light selected pill */
  ActiveIcon: React.FC<SvgProps>;
  /** icon drawn on the card when not selected */
  Icon: React.FC<SvgProps>;
};

type Props<K extends string> = {
  segments: Segment<K>[];
  value: K;
  onChange: (key: K) => void;
};

/** Pill shaped two-way switch (Panchang | Festivals) */
export default function SegmentedControl<K extends string>({ segments, value, onChange }: Props<K>) {
  return (
    <GlassCard angle={120.97} style={styles.container}>
      {segments.map(({ key, label, Icon, ActiveIcon }) => {
        const active = key === value;
        const SegmentIcon = active ? ActiveIcon : Icon;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <SegmentIcon width={20} height={20} />
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  // Design padding 4 minus the 1px border
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 3,
    borderRadius: 50,
  },
  segment: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: {
    color: colors.black,
  },
});
