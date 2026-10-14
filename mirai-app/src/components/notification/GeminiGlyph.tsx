import React from 'react';
import { StyleSheet, View } from 'react-native';
import Part01 from '../../assets/images/notification-gemini-01.svg';
import Part02 from '../../assets/images/notification-gemini-02.svg';
import Part03 from '../../assets/images/notification-gemini-03.svg';
import Part04 from '../../assets/images/notification-gemini-04.svg';
import Part05 from '../../assets/images/notification-gemini-05.svg';
import Part06 from '../../assets/images/notification-gemini-06.svg';
import Part07 from '../../assets/images/notification-gemini-07.svg';
import Part08 from '../../assets/images/notification-gemini-08.svg';
import Part09 from '../../assets/images/notification-gemini-09.svg';
import Part10 from '../../assets/images/notification-gemini-10.svg';
import Part11 from '../../assets/images/notification-gemini-11.svg';
import Part12 from '../../assets/images/notification-gemini-12.svg';
import Part13 from '../../assets/images/notification-gemini-13.svg';
import Part14 from '../../assets/images/notification-gemini-14.svg';
import Part15 from '../../assets/images/notification-gemini-15.svg';
import Part16 from '../../assets/images/notification-gemini-16.svg';
import Part17 from '../../assets/images/notification-gemini-17.svg';
import Part18 from '../../assets/images/notification-gemini-18.svg';
import Part19 from '../../assets/images/notification-gemini-19.svg';
import Part20 from '../../assets/images/notification-gemini-20.svg';
import Part21 from '../../assets/images/notification-gemini-21.svg';
import Part22 from '../../assets/images/notification-gemini-22.svg';
import Part23 from '../../assets/images/notification-gemini-23.svg';
import Part24 from '../../assets/images/notification-gemini-24.svg';
import Part25 from '../../assets/images/notification-gemini-25.svg';
import Part26 from '../../assets/images/notification-gemini-26.svg';
import Part27 from '../../assets/images/notification-gemini-27.svg';
import Part28 from '../../assets/images/notification-gemini-28.svg';
import Part29 from '../../assets/images/notification-gemini-29.svg';
import Part30 from '../../assets/images/notification-gemini-30.svg';
import Part31 from '../../assets/images/notification-gemini-31.svg';
import Part32 from '../../assets/images/notification-gemini-32.svg';
import Part33 from '../../assets/images/notification-gemini-33.svg';
import Part34 from '../../assets/images/notification-gemini-34.svg';
import Part35 from '../../assets/images/notification-gemini-35.svg';
import Part36 from '../../assets/images/notification-gemini-36.svg';
import Part37 from '../../assets/images/notification-gemini-37.svg';
import Part38 from '../../assets/images/notification-gemini-38.svg';
import Part39 from '../../assets/images/notification-gemini-39.svg';
import Part40 from '../../assets/images/notification-gemini-40.svg';

// Gemini constellation from the Figma "Group" layer (7763:123740): 40 star / line
// pieces, each placed at its Figma offset inside the 34.78 x 24 group
const PARTS = [
  { Icon: Part01, left: 27.13, top: 16.08, width: 3.558, height: 3.455 },
  { Icon: Part02, left: 0.66, top: 6.67, width: 3.558, height: 3.455 },
  { Icon: Part03, left: 0, top: 17.88, width: 3.558, height: 3.455 },
  { Icon: Part04, left: 6.47, top: 21.09, width: 2.112, height: 2.051 },
  { Icon: Part05, left: 14.14, top: 18.01, width: 2.112, height: 2.051 },
  { Icon: Part06, left: 14.58, top: 8.48, width: 2.112, height: 2.051 },
  { Icon: Part07, left: 23.08, top: 4.3, width: 2.112, height: 2.051 },
  { Icon: Part08, left: 27.33, top: 0, width: 2.112, height: 2.051 },
  { Icon: Part09, left: 27.09, top: 7.44, width: 2.112, height: 2.051 },
  { Icon: Part10, left: 32.67, top: 21.95, width: 2.112, height: 2.051 },
  { Icon: Part11, left: 2.12, top: 10.55, width: 0.441, height: 0.441 },
  { Icon: Part12, left: 1.92, top: 11.89, width: 0.59, height: 4.462 },
  { Icon: Part13, left: 1.87, top: 17.25, width: 0.441, height: 0.441 },
  { Icon: Part14, left: 3.71, top: 20.45, width: 0.441, height: 0.44 },
  { Icon: Part15, left: 4.78, top: 20.94, width: 0.442, height: 0.442 },
  { Icon: Part16, left: 5.84, top: 21.44, width: 0.441, height: 0.442 },
  { Icon: Part17, left: 8.63, top: 21.45, width: 0.441, height: 0.44 },
  { Icon: Part18, left: 9.85, top: 20.02, width: 2.882, height: 1.391 },
  { Icon: Part19, left: 13.51, top: 19.55, width: 0.441, height: 0.441 },
  { Icon: Part20, left: 4.33, top: 8.36, width: 0.441, height: 0.441 },
  { Icon: Part21, left: 5.69, top: 8.46, width: 7.217, height: 0.952 },
  { Icon: Part22, left: 13.82, top: 9.07, width: 0.441, height: 0.441 },
  { Icon: Part23, left: 16.7, top: 8.67, width: 0.441, height: 0.441 },
  { Icon: Part24, left: 17.89, top: 6.3, width: 4.007, height: 2.22 },
  { Icon: Part25, left: 22.64, top: 5.71, width: 0.441, height: 0.441 },
  { Icon: Part26, left: 25.06, top: 3.86, width: 0.442, height: 0.441 },
  { Icon: Part27, left: 26.14, top: 2.78, width: 0.441, height: 0.442 },
  { Icon: Part28, left: 27.22, top: 1.7, width: 0.441, height: 0.442 },
  { Icon: Part29, left: 24.92, top: 5.99, width: 0.441, height: 0.441 },
  { Icon: Part30, left: 25.86, top: 6.78, width: 0.441, height: 0.442 },
  { Icon: Part31, left: 26.8, top: 7.56, width: 0.441, height: 0.441 },
  { Icon: Part32, left: 28.4, top: 9.53, width: 0.441, height: 0.441 },
  { Icon: Part33, left: 28.47, top: 10.77, width: 0.655, height: 4.167 },
  { Icon: Part34, left: 28.75, top: 15.74, width: 0.442, height: 0.441 },
  { Icon: Part35, left: 29.98, top: 19.04, width: 0.441, height: 0.44 },
  { Icon: Part36, left: 30.71, top: 19.85, width: 1.179, height: 1.257 },
  { Icon: Part37, left: 32.19, top: 21.48, width: 0.442, height: 0.441 },
  { Icon: Part38, left: 26.85, top: 17.1, width: 0.441, height: 0.442 },
  { Icon: Part39, left: 17.87, top: 17.27, width: 8.135, height: 1.44 },
  { Icon: Part40, left: 16.59, top: 18.43, width: 0.441, height: 0.441 },
];

export const GEMINI_GLYPH_WIDTH = 34.778;
export const GEMINI_GLYPH_HEIGHT = 24;

export default function GeminiGlyph() {
  return (
    <View style={styles.group}>
      {PARTS.map(({ Icon, left, top, width, height }, i) => (
        <Icon
          key={i}
          width={width}
          height={height}
          style={[styles.part, { left, top }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    width: GEMINI_GLYPH_WIDTH,
    height: GEMINI_GLYPH_HEIGHT,
  },
  part: {
    position: 'absolute',
  },
});
