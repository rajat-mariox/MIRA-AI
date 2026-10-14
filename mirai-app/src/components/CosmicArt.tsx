import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Rings from '../assets/images/rings.svg';
import { DESIGN_WIDTH } from '../theme';

const glow = require('../assets/images/glow-bg.png');
const noise = require('../assets/images/noise-texture.png');
const emblem = require('../assets/images/mirai-emblem.png');

// Positions of the top artwork in the 375×812 Figma frame (Welcome, OTP)
const ART = {
  glow: { left: 57.43, top: 58.83, size: 257.929 },
  rings: { left: -28.0, top: -27.43, size: 430.429 },
  noise: { left: 58.25, top: -57.0, width: 257.107, height: 379.5 },
  // MIRAI emblem, centred where the Figma symbol (147.5×135.9 at 113.28, 121.25) sits
  emblem: { left: 112.02, top: 114.19, size: 150 },
};

// Content below the artwork should not start above this line (design px, scaled)
export const COSMIC_ART_RESERVED_HEIGHT = 330;

// Glow, concentric rings, noise texture and the MIRAI emblem, scaled with the screen width.
// `scale` shrinks it from the top centre (login screens shrink it while the keyboard is open).
export default function CosmicArt({ scale = 1 }: { scale?: number }) {
  const { width } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.origin, { transform: [{ scale }] }]}
      pointerEvents="none"
    >
      <Image
        source={glow}
        resizeMode="cover"
        style={[
          styles.abs,
          styles.glow,
          {
            left: ART.glow.left * s,
            top: ART.glow.top * s,
            width: ART.glow.size * s,
            height: ART.glow.size * s,
          },
        ]}
      />
      <Rings
        width={ART.rings.size * s}
        height={ART.rings.size * s}
        style={[styles.abs, { left: ART.rings.left * s, top: ART.rings.top * s }]}
      />
      <View
        style={[
          styles.abs,
          styles.noiseFrame,
          {
            left: ART.noise.left * s,
            top: ART.noise.top * s,
            width: ART.noise.width * s,
            height: ART.noise.height * s,
          },
        ]}
      >
        <Image
          source={noise}
          style={[
            styles.abs,
            {
              left: -0.2366 * ART.noise.width * s,
              top: -0.2329 * ART.noise.height * s,
              width: 1.4733 * ART.noise.width * s,
              height: ART.noise.height * s,
            },
          ]}
        />
      </View>
      <Image
        source={emblem}
        accessibilityLabel="MIRAI"
        style={[
          styles.abs,
          {
            left: ART.emblem.left * s,
            top: ART.emblem.top * s,
            width: ART.emblem.size * s,
            height: ART.emblem.size * s,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  origin: {
    transformOrigin: 'top',
  },
  abs: {
    position: 'absolute',
  },
  glow: {
    mixBlendMode: 'plus-lighter',
  },
  noiseFrame: {
    overflow: 'hidden',
    transform: [{ rotate: '180deg' }],
  },
});
