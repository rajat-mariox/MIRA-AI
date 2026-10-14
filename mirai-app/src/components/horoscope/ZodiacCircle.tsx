import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

type Props = {
  size: number;
  selected?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Selected ring: 2px stroke, #47C8FE top-left to #F62473 bottom-right
const RING_FROM = '#47C8FE';
const RING_TO = '#F62473';
const RING_WIDTH = 2;

let nextId = 0;

/**
 * Dark translucent zodiac disc. Idle it has a 1px grey border; selected it gets the
 * blue-to-pink gradient ring. Content (constellation art, label) is centred.
 */
export default function ZodiacCircle({ size, selected = false, children, style }: Props) {
  const [gradientId] = useState(() => `zodiacRing${nextId++}`);

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        !selected && styles.idle,
        style,
      ]}
    >
      {selected && (
        <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <LinearGradient id={gradientId} x1={0} y1={0} x2={size} y2={size} gradientUnits="userSpaceOnUse">
              <Stop offset={0} stopColor={RING_FROM} />
              <Stop offset={1} stopColor={RING_TO} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={(size - RING_WIDTH) / 2}
            stroke={`url(#${gradientId})`}
            strokeWidth={RING_WIDTH}
            fill="none"
          />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.16)',
  },
  idle: {
    borderWidth: 1,
    borderColor: '#ABABAB',
  },
});
