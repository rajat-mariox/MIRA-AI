import React, { useEffect, useRef } from 'react';
import { Animated, Image, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Rings from '../assets/images/splash-rings.svg';
import type { RootStackParamList } from '../navigation/types';
import { routesForUser } from '../navigation/navigationRef';
import { useSession } from '../context/OnboardingContext';
import { colors, DESIGN_WIDTH } from '../theme';

// Nebula video frame with the design's hard-light blue→pink gradient baked in
// (Android does not render Figma's hard-light blend the same way)
const background = require('../assets/images/splash-background.png');
const glow = require('../assets/images/glow-bg.png');
const emblem = require('../assets/images/mirai-emblem.png');

// Sizes from the 375×812 Figma frame. Everything is centred 2px above the screen centre.
const ART = {
  glow: 314,
  rings: 524,
  // MIRAI emblem in place of the template symbol (140×129)
  emblem: 140,
  centerOffset: -2,
};

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const s = width / DESIGN_WIDTH;
  const opacity = useRef(new Animated.Value(0)).current;
  const { restoreSession } = useSession();

  const cx = width / 2;
  const cy = height / 2 + ART.centerOffset * s;
  const centred = (w: number, h = w) => ({
    left: cx - (w * s) / 2,
    top: cy - (h * s) / 2,
    width: w * s,
    height: h * s,
  });

  useEffect(() => {
    let cancelled = false;
    Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    // Show the splash for at least 2s while the stored session is restored (GET /users/me)
    const minDelay = new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
    Promise.all([restoreSession().catch(() => null), minDelay]).then(([user]) => {
      if (cancelled) return;
      if (user) {
        const routes = routesForUser(user);
        navigation.reset({ index: routes.length - 1, routes });
      } else {
        navigation.replace('Welcome');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigation, opacity, restoreSession]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Image source={background} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <Image source={glow} resizeMode="cover" style={[styles.abs, styles.plusLighter, centred(ART.glow)]} />
      <Rings width={ART.rings * s} height={ART.rings * s} style={[styles.abs, centred(ART.rings)]} />
      <Animated.Image
        source={emblem}
        accessibilityLabel="MIRAI"
        style={[styles.abs, centred(ART.emblem), { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
  },
  plusLighter: {
    mixBlendMode: 'plus-lighter',
  },
});
