import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { resolveMediaUrl } from '../utils/media';

type Props = {
  size: number;
  /** profile photo; without one a neutral outlined person icon is shown */
  uri?: string | null;
  style?: StyleProp<ViewStyle>;
};

/** Outlined person (head + shoulders) drawn in a 24×24 box. */
export function PersonGlyph({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.2} r={3.8} stroke={color} strokeWidth={1.5} />
      <Path d="M4.6 20.2c0-3.6 3.3-6.2 7.4-6.2s7.4 2.6 7.4 6.2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Round avatar: the user's photo, or a translucent circle with a white person outline. */
export default function UserAvatar({ size, uri: rawUri, style }: Props) {
  const uri = resolveMediaUrl(rawUri);
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return (
      <View style={[round, styles.photo, style]}>
        <Image source={{ uri }} style={round} />
      </View>
    );
  }
  return (
    <View style={[styles.empty, round, style]} accessibilityLabel="Profile picture">
      <PersonGlyph size={Math.round(size * 0.6)} />
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
});
