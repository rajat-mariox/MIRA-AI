import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TableRow } from './panchangRows';
import { colors, fonts } from '../../theme';

const LINE = 'rgba(255, 255, 255, 0.28)';

/** Bordered two-column table (label | value) used by the Panchang detail sections */
export default function PanchangTable({ rows, emptyText = 'No details available.' }: { rows: TableRow[]; emptyText?: string }) {
  if (rows.length === 0) return <Text style={styles.empty}>{emptyText}</Text>;
  return (
    <View style={styles.table}>
      {rows.map((r, i) => (
        <View key={`${r.label}-${i}`} style={[styles.row, i > 0 && styles.rowDivider]}>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.label}>{r.label}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  labelCell: {
    flex: 0.9,
    borderRightWidth: 1,
    borderRightColor: LINE,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  value: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
});
