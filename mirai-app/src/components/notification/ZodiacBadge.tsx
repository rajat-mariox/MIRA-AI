import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import GeminiGlyph from './GeminiGlyph';

const SIZE = 50;
const STROKE = 2;

let nextId = 0;

/**
 * 50dp round sign badge: 60% black fill, 2dp inside stroke with a blue-to-pink
 * diagonal gradient (top-left to bottom-right) and the constellation centred.
 */
export default function ZodiacBadge() {
  const [id] = useState(() => `zodiacring${nextId++}`);

  return (
    <View style={styles.badge}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset={0} stopColor="#47C8FE" />
            <Stop offset={1} stopColor="#F62473" />
          </LinearGradient>
        </Defs>
        {/* Figma strokes sit inside the box, so the ring's centre line is 1dp in */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={(SIZE - STROKE) / 2}
          fill="rgba(0, 0, 0, 0.6)"
          stroke={`url(#${id})`}
          strokeWidth={STROKE}
        />
      </Svg>
      <GeminiGlyph />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.16)',
  },
});
