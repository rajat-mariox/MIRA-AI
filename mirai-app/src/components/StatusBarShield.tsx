import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from './GradientBackground';

/**
 * Covers the status bar with the matching slice of the screen gradient once the page
 * has scrolled, so content slides under the clock/battery icons instead of over them.
 * Invisible while the page is at the top, so the resting layout matches the design.
 */
export default function StatusBarShield({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shield, { height: insets.top, opacity }]}
    >
      <View style={{ height }}>
        <GradientBackground />
      </View>
    </Animated.View>
  );
}

/** Tracks whether a scroll view has left the top; pass `onScroll` to the ScrollView */
export function useScrolledFromTop() {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const isScrolled = e.nativeEvent.contentOffset.y > 0;
    setScrolled(prev => (prev === isScrolled ? prev : isScrolled));
  }, []);
  return { scrolled, onScroll };
}

const styles = StyleSheet.create({
  shield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
