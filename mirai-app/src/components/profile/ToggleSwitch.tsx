import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

// Figma: 48×28 pill, 20×20 white knob 4dp from the edge
const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 20;
const KNOB_INSET = 4;
const TRAVEL = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2;

// Pill switch from the Profile notifications card; the knob slides and the track fades to blue
export default function ToggleSwitch({ value, onValueChange, accessibilityLabel }: Props) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [progress, value]);

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      style={styles.track}
    >
      <Animated.View style={[styles.trackOn, { opacity: progress }]} />
      <Animated.View
        style={[
          styles.knob,
          {
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRAVEL] }) },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  trackOn: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ABDAF2',
  },
  knob: {
    position: 'absolute',
    top: KNOB_INSET,
    left: KNOB_INSET,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.white,
  },
});
