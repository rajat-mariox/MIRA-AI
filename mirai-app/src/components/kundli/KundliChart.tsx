import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Polygon, Rect } from 'react-native-svg';
import type { ChartHouse, ChartPlanet } from '../../api/kundli';
import { colors, fonts } from '../../theme';

// The chart is drawn on a 335×335 canvas, as in the Figma frame, and scaled to the page width
const SIZE = 335;
const STROKE = 4;

// Diamond (a 235dp square rotated 45°) centred where the design puts it; its 4dp border sits
// inside the square, so the stroke centre line is 2·√2 in from the outer corners
const CX = 167;
const CY = 167.17;
const HALF = 235 * Math.SQRT1_2 - 2 * Math.SQRT2;
const DIAMOND = [
  [CX, CY - HALF],
  [CX + HALF, CY],
  [CX, CY + HALF],
  [CX - HALF, CY],
]
  .map(p => p.join(','))
  .join(' ');

/**
 * North-Indian layout: house 1 is the top diamond and houses run anticlockwise.
 * `sign` = where the sign number sits (next to the inner corner), `planets` = centre of the
 * planet block, `cols` = planets per line (the side triangles are narrow).
 */
const LAYOUT: Record<number, { sign: [number, number]; planets: [number, number]; cols: number }> = {
  1: { sign: [167, 136], planets: [167, 76], cols: 2 },
  2: { sign: [84, 62], planets: [84, 24], cols: 2 },
  3: { sign: [62, 84], planets: [24, 84], cols: 1 },
  4: { sign: [136, 167], planets: [80, 167], cols: 2 },
  5: { sign: [62, 251], planets: [24, 251], cols: 1 },
  6: { sign: [84, 273], planets: [84, 310], cols: 2 },
  7: { sign: [167, 198], planets: [167, 258], cols: 2 },
  8: { sign: [251, 273], planets: [251, 310], cols: 2 },
  9: { sign: [273, 251], planets: [311, 251], cols: 1 },
  10: { sign: [198, 167], planets: [254, 167], cols: 2 },
  11: { sign: [273, 84], planets: [311, 84], cols: 1 },
  12: { sign: [251, 62], planets: [251, 24], cols: 2 },
};

const PLANET_LINE = 16;
const PLANET_WIDTH = 34;

const ABBR: Record<string, string> = {
  sun: 'Su',
  moon: 'Mo',
  mars: 'Ma',
  mercury: 'Me',
  jupiter: 'Ju',
  venus: 'Ve',
  saturn: 'Sa',
  rahu: 'Ra',
  ketu: 'Ke',
  uranus: 'Ur',
  neptune: 'Ne',
  pluto: 'Pl',
  ascendant: 'La',
  lagna: 'La',
};

function planetLabel(p: ChartPlanet) {
  const name = String(p.name ?? '').trim();
  const abbr = ABBR[name.toLowerCase()] ?? (p.symbol ? String(p.symbol) : name.slice(0, 2));
  const retro = p.is_retro === true || String(p.is_retro).toLowerCase() === 'true';
  const deg = Number(p.degree);
  return { text: `${abbr}${retro ? '*' : ''}`, degree: Number.isFinite(deg) ? String(Math.floor(deg)).padStart(2, '0') : '' };
}

type Props = {
  /** houses "1".."12" from GET /kundli/charts/:id */
  houses: Record<string, ChartHouse>;
  /** side length; defaults to the page width minus the 20dp margins */
  size?: number;
};

/** North-Indian diamond Kundli chart: sign numbers per house and the planets in it. */
export default function KundliChart({ houses, size }: Props) {
  const { width } = useWindowDimensions();
  const side = size ?? width - 40;
  const scale = side / SIZE;

  const nodes: React.ReactNode[] = [];
  for (let n = 1; n <= 12; n++) {
    const house = houses[String(n)];
    if (!house) continue;
    const { sign, planets, cols } = LAYOUT[n];
    if (house.sign_no) {
      nodes.push(
        <Text key={`s${n}`} style={[styles.sign, { left: sign[0] - 15, top: sign[1] - 12 }]}>
          {house.sign_no}
        </Text>,
      );
    }
    const list = (house.planet ?? []).map(planetLabel);
    const rows = Math.ceil(list.length / cols);
    list.forEach((p, i) => {
      const row = Math.floor(i / cols);
      const inRow = Math.min(cols, list.length - row * cols);
      const col = i % cols;
      const x = planets[0] - (inRow * PLANET_WIDTH) / 2 + col * PLANET_WIDTH;
      const y = planets[1] - (rows * PLANET_LINE) / 2 + row * PLANET_LINE;
      nodes.push(
        <Text key={`p${n}-${i}`} style={[styles.planet, { left: x, top: y, width: PLANET_WIDTH }]} numberOfLines={1}>
          {p.text}
          {!!p.degree && <Text style={styles.degree}>{p.degree}</Text>}
        </Text>,
      );
    });
  }

  return (
    <View style={{ width: side, height: side }}>
      <View
        style={[
          styles.canvas,
          {
            left: (side - SIZE) / 2,
            top: (side - SIZE) / 2,
            transform: [{ scale }],
          },
        ]}
      >
        <Svg width={SIZE} height={SIZE}>
          <Rect
            x={STROKE / 2}
            y={STROKE / 2}
            width={SIZE - STROKE}
            height={SIZE - STROKE}
            fill="rgba(167, 216, 242, 0.1)"
            stroke={colors.white}
            strokeWidth={STROKE}
          />
          <Polygon points={DIAMOND} fill="none" stroke={colors.white} strokeWidth={STROKE} />
          {/* Corner-to-corner diagonals, offset 2dp as in the design */}
          <Line x1={1.41} y1={1.59} x2={333.41} y2={333.59} stroke={colors.white} strokeWidth={STROKE} />
          <Line x1={333.41} y1={1.41} x2={1.41} y2={333.41} stroke={colors.white} strokeWidth={STROKE} />
        </Svg>
        {nodes}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    overflow: 'hidden',
  },
  sign: {
    position: 'absolute',
    width: 30,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  planet: {
    position: 'absolute',
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: PLANET_LINE,
    color: colors.primary,
    includeFontPadding: false,
  },
  degree: {
    fontSize: 8,
    color: colors.white,
  },
});
