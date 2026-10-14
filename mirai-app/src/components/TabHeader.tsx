import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import { colors, DESIGN_STATUS_BAR, fonts, MONTHS, WEEKDAYS } from '../theme';

type Props = {
  title: string;
  Icon: React.FC<SvgProps>;
  /** defaults to today, e.g. "Monday, 20 March" */
  subtitle?: string;
};

export function formatToday(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** Icon badge + bold uppercase title + date, with a divider. Used by the Kundli and Panchang tabs. */
export default function TabHeader({ title, Icon, subtitle }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR) + 16 }]}>
      <View style={styles.container}>
        <View style={styles.badge}>
          <Icon width={24} height={24} />
        </View>
        <View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle ?? formatToday()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    // 17 in Figma, where the 1dp divider sits inside the box
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  badge: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.iconButton,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.1,
    color: colors.white,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
});
