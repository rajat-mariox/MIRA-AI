import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

export type PlanetRow = { planet: string; sign: string; naks: string; degree: string };

const HEADERS = ['Planets', 'Sign', 'Naks', 'Degree'];

type Props = { rows: PlanetRow[] };

/** Bordered 4-column table of planet positions; the sign column is underlined. */
export default function PlanetsTable({ rows }: Props) {
  return (
    <View style={styles.table}>
      <View style={styles.header}>
        {HEADERS.map((h, i) => (
          <React.Fragment key={h}>
            {i > 0 && <View style={styles.headerDivider} />}
            <Text style={styles.headerText}>{h}</Text>
          </React.Fragment>
        ))}
      </View>
      {rows.map((r, ri) => (
        // The first row is 4dp shorter than the rest in the design
        <View key={`${r.planet}-${ri}`} style={styles.row}>
          <View style={[styles.cell, ri === 0 && styles.firstCell]}>
            <Text style={styles.text}>{r.planet}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.cell, ri === 0 && styles.firstCell]}>
            <Text style={styles.sign} numberOfLines={1}>
              {r.sign}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.cell, ri === 0 && styles.firstCell]}>
            <Text style={styles.text}>{r.naks}</Text>
          </View>
          <View style={styles.divider} />
          <View style={[styles.cell, ri === 0 && styles.firstCell]}>
            <Text style={styles.text}>{r.degree}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const DIVIDER = 'rgba(255, 255, 255, 0.6)';

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // 40dp including the 1dp bottom border
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: 'rgba(167, 216, 242, 0.24)',
  },
  headerDivider: {
    width: 0.5,
    height: 38,
    backgroundColor: DIVIDER,
  },
  headerText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: colors.white,
    includeFontPadding: false,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(167, 216, 242, 0.1)',
  },
  divider: {
    width: 0.5,
    backgroundColor: DIVIDER,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // The design pads cells by 12dp but lets SAGITTARIUS overflow its padding; centred text
    // looks the same without it and never gets ellipsized
    paddingVertical: 10,
  },
  firstCell: {
    paddingVertical: 8,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.5,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    includeFontPadding: false,
  },
  sign: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 20,
    textTransform: 'uppercase',
    textDecorationLine: 'underline',
    color: colors.white,
    includeFontPadding: false,
  },
});
