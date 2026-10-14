import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export type GradientStop = { offset: number; color: string; opacity?: number };

type Props = {
  /** CSS gradient angle in degrees (0deg points up, 90deg points right) */
  angle: number;
  stops: GradientStop[];
};

let nextId = 0;

/**
 * Fills its parent with a linear gradient that matches CSS `linear-gradient(<angle>deg, ...)`
 * exactly, including the CSS gradient-line length rule, for any box size.
 */
export default function CssLinearGradient({ angle, stops }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [id] = useState(() => `cssgrad${nextId++}`);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const { width: w, height: h } = size;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const length = Math.abs(w * dx) + Math.abs(h * dy);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="none">
      {w > 0 && h > 0 && (
        <Svg width={w} height={h}>
          <Defs>
            <LinearGradient
              id={id}
              gradientUnits="userSpaceOnUse"
              x1={w / 2 - (dx * length) / 2}
              y1={h / 2 - (dy * length) / 2}
              x2={w / 2 + (dx * length) / 2}
              y2={h / 2 + (dy * length) / 2}
            >
              {stops.map(stop => (
                <Stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity ?? 1}
                />
              ))}
            </LinearGradient>
          </Defs>
          <Rect width={w} height={h} fill={`url(#${id})`} />
        </Svg>
      )}
    </View>
  );
}
