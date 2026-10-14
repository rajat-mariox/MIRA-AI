import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

type Props = {
  /** 0..100 */
  percent: number;
  /** canvas width of the design's progress art (132, 274 or 306) */
  width: number;
  /** stroke width: 2 for the forecast bars, 6 for the career rating */
  thickness?: number;
  style?: StyleProp<ViewStyle>;
};

const TRACK = '#313542';
const FILL = '#A7D8F2';

/**
 * The design's rounded progress line (grey track + blue fill) with a variable fill.
 * Same geometry as the exported SVGs: the track starts one stroke in, the fill at half a stroke.
 */
export default function ScoreBar({ percent, width, thickness = 2, style }: Props) {
  const half = thickness / 2;
  const end = width - half;
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0)) / 100;
  const fillEnd = half + (end - half) * p;
  return (
    <Svg width={width} height={thickness} style={style}>
      <Line x1={thickness} y1={half} x2={end} y2={half} stroke={TRACK} strokeWidth={thickness} strokeLinecap="round" />
      {p > 0 && (
        <Line x1={half} y1={half} x2={fillEnd} y2={half} stroke={FILL} strokeWidth={thickness} strokeLinecap="round" />
      )}
    </Svg>
  );
}
