import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import CssLinearGradient, { GradientStop } from './CssLinearGradient';
import { cardGradients, colors } from '../theme';

type Props = {
  children?: React.ReactNode;
  angle: number;
  stops?: GradientStop[];
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
};

// Rounded card with a thin border and a translucent diagonal gradient fill
export default function GlassCard({
  children,
  angle,
  stops = cardGradients.idle,
  borderColor = colors.cardBorder,
  style,
}: Props) {
  return (
    <View style={[styles.card, { borderColor }, style]}>
      <CssLinearGradient angle={angle} stops={stops} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
