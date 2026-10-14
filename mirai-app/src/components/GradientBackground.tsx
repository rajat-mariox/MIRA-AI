import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme';

// Blue-to-pink gradient with a 40% black overlay, used behind the auth screens
export default function GradientBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.gradientTop, colors.gradientBottom]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.gradientOverlay }]} />
    </View>
  );
}
