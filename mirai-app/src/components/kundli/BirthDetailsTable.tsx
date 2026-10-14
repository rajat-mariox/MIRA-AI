import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

export type BirthDetail = { label: string; value: string };

type Props = { rows: BirthDetail[] };

/** Bordered label / value table with alternating row tints. */
export default function BirthDetailsTable({ rows }: Props) {
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={r.label} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
          <View style={styles.labelCell}>
            <Text style={styles.label}>{r.label}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.valueCell}>
            <Text style={styles.value} numberOfLines={1}>
              {r.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    height: 36,
    backgroundColor: 'rgba(167, 216, 242, 0.1)',
  },
  rowAlt: {
    backgroundColor: 'rgba(167, 216, 242, 0.2)',
  },
  // Both cells carry the bottom border (the divider between them does not)
  labelCell: {
    // 140dp from the outer edge in the design; the 1dp table border takes the first dp here
    width: 139,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  divider: {
    width: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  valueCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  value: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 20,
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
});
