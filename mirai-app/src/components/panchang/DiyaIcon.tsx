import React from 'react';
import Svg, { Circle, Path, type SvgProps } from 'react-native-svg';
import { colors } from '../../theme';

/** Line-art diya (oil lamp) with a flame and two sparkles; 28x28 artwork, white strokes. */
export default function DiyaIcon(props: SvgProps) {
  return (
    <Svg viewBox="0 0 28 28" fill="none" {...props}>
      {/* flame */}
      <Path
        d="M14 4.5C15.9 7 16.8 8.9 16.8 10.6C16.8 12.3 15.5 13.6 14 13.6C12.5 13.6 11.2 12.3 11.2 10.6C11.2 8.9 12.1 7 14 4.5Z"
        stroke={colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
        fill="rgba(167, 216, 242, 0.25)"
      />
      {/* bowl */}
      <Path
        d="M4 16.2H24C23.2 20.3 19.1 23 14 23C8.9 23 4.8 20.3 4 16.2Z"
        stroke="white"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      {/* wick spout + base */}
      <Path d="M24 16.2L25.8 14.8" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M10.5 25H17.5" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
      {/* sparkles */}
      <Path d="M5.5 6V9.4M3.8 7.7H7.2" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M22.5 5V7.6M21.2 6.3H23.8" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={20.6} cy={11} r={0.9} fill="white" />
    </Svg>
  );
}
