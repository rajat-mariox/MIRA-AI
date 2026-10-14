import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ArrowUp from '../../assets/images/kundli-arrow-up.svg';
import { colors, fonts } from '../../theme';

/** Key for the marks used in the chart (retrograde, combust, vargottama, exalted, debilitated). */
export default function KundliLegend() {
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <Text style={[styles.label, styles.cell]} numberOfLines={1}>
          * Retrograde
        </Text>
        <View style={styles.cell}>
          <Text style={styles.label} numberOfLines={1}>
            ^ Combust
          </Text>
        </View>
        {/* Wider than its column in the design too; it is centred and overhangs both sides */}
        <View style={[styles.cell, styles.iconCell, styles.centered]}>
          <View style={styles.squareWrap}>
            <View style={styles.square} />
          </View>
          <Text style={[styles.label, styles.noShrink]} numberOfLines={1}>
            Vargottama
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.cell, styles.iconCell]}>
          <View style={styles.arrowWrap}>
            <ArrowUp width={8} height={8} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            Exalted
          </Text>
        </View>
        <View style={[styles.cell, styles.iconCell]}>
          <View style={styles.arrowWrap}>
            <ArrowUp width={8} height={8} style={styles.down} />
          </View>
          <Text style={styles.label} numberOfLines={1}>
            Debilitated
          </Text>
        </View>
        {/* Empty third column keeps the grid aligned with the row above */}
        <View style={styles.cell} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(167, 216, 242, 0.1)',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  cell: {
    flex: 1,
    minWidth: 0,
  },
  iconCell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  centered: {
    justifyContent: 'center',
  },
  label: {
    // Design uses Inter SemiBold, which is not bundled; Inter Bold is the closest available
    fontFamily: fonts.interBold,
    fontSize: 14,
    lineHeight: 17,
    color: colors.white,
    includeFontPadding: false,
  },
  noShrink: {
    flexShrink: 0,
  },
  squareWrap: {
    paddingTop: 3,
  },
  square: {
    width: 6,
    height: 6,
    borderWidth: 1,
    borderColor: colors.white,
  },
  arrowWrap: {
    paddingTop: 2,
  },
  down: {
    transform: [{ rotate: '180deg' }],
  },
});
