import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Rings from '../assets/images/splash-rings.svg';
import type { RootStackParamList } from '../navigation/types';
import { routesForUser } from '../navigation/navigationRef';
import GradientBackground from '../components/GradientBackground';
import CosmicArt, { COSMIC_EMBLEM } from '../components/CosmicArt';
import { useSession } from '../context/OnboardingContext';
import { DESIGN_WIDTH } from '../theme';

// Nebula video frame with the design's hard-light blue→pink gradient baked in
// (Android does not render Figma's hard-light blend the same way)
const background = require('../assets/images/splash-background.png');
const glow = require('../assets/images/glow-bg-alpha.png');
const emblem = require('../assets/images/mirai-emblem.png');

// Sizes from the 375×812 Figma frame. Everything is centred 2px above the screen centre.
const ART = {
  glow: 314,
  rings: 524,
  // MIRAI emblem in place of the template symbol (140×129)
  emblem: 140,
  centerOffset: -2,
};

// The design's background is a slow space video: measured from Figma's export it zooms in
// ~1.27%/s and turns ~0.59°/s around the screen centre. The same drift runs on the nebula image
// (one long pass; the splash leaves after ~2-3s). Any corner it uncovers shows the identical
// native launch background behind this transparent screen.
const DRIFT_MS = 8000;
const DRIFT_SCALE = 1 + 0.0127 * (DRIFT_MS / 1000);
const DRIFT_DEG = 0.59 * (DRIFT_MS / 1000);

// Hand-over to Welcome (like the prototype's smart animate): the emblem glides up into its
// Welcome spot while the Welcome backdrop fades in; Welcome then opens with no transition.
const OUTRO_MS = 650;
// Shortest time the splash stays up (the emblem fades in over 600ms)
const MIN_SPLASH_MS = 1200;

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const screen = Dimensions.get('screen');
  const s = width / DESIGN_WIDTH;
  const opacity = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const outro = useRef(new Animated.Value(0)).current;
  const { restoreSession } = useSession();

  const cx = width / 2;
  const cy = height / 2 + ART.centerOffset * s;
  const centred = (w: number, h = w) => ({
    left: cx - (w * s) / 2,
    top: cy - (h * s) / 2,
    width: w * s,
    height: h * s,
  });

  // Centre and size of the emblem on the Welcome screen (CosmicArt), relative to the splash one
  const emblemTarget = {
    dx: (COSMIC_EMBLEM.left + COSMIC_EMBLEM.size / 2) * s - cx,
    dy: (COSMIC_EMBLEM.top + COSMIC_EMBLEM.size / 2) * s - cy,
    scale: COSMIC_EMBLEM.size / ART.emblem,
  };

  useEffect(() => {
    let cancelled = false;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(drift, {
      toValue: 1,
      duration: DRIFT_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    // Show the splash briefly while the stored session is restored
    const minDelay = new Promise<void>(resolve =>
      setTimeout(() => resolve(), MIN_SPLASH_MS),
    );
    Promise.all([restoreSession().catch(() => null), minDelay]).then(
      ([user]) => {
        if (cancelled) return;
        if (user) {
          const routes = routesForUser(user);
          navigation.reset({ index: routes.length - 1, routes });
        } else {
          Animated.timing(outro, {
            toValue: 1,
            duration: OUTRO_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            if (!cancelled) navigation.replace('Welcome', { fromSplash: true });
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [navigation, opacity, drift, outro, restoreSession]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* Stretched over the whole physical screen exactly like the native launch background
          (bitmap gravity="fill"), so the hand-over from it is seamless */}
      <Animated.Image
        source={background}
        resizeMode="stretch"
        fadeDuration={0}
        style={[
          styles.fullScreen,
          {
            width: screen.width,
            height: screen.height,
            transform: [
              {
                scale: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, DRIFT_SCALE],
                }),
              },
              {
                rotate: drift.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', `${DRIFT_DEG}deg`],
                }),
              },
            ],
          },
        ]}
      />
      <Image
        source={glow}
        resizeMode="cover"
        fadeDuration={0}
        style={[styles.abs, centred(ART.glow)]}
      />
      <Rings
        width={ART.rings * s}
        height={ART.rings * s}
        style={[styles.abs, centred(ART.rings)]}
      />
      {/* Welcome's backdrop, faded in during the hand-over */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: outro }]}
        pointerEvents="none"
      >
        <GradientBackground />
        <CosmicArt showEmblem={false} />
      </Animated.View>
      <Animated.Image
        source={emblem}
        accessibilityLabel="MIRAI"
        style={[
          styles.abs,
          centred(ART.emblem),
          {
            opacity,
            transform: [
              {
                translateX: outro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, emblemTarget.dx],
                }),
              },
              {
                translateY: outro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, emblemTarget.dy],
                }),
              },
              {
                scale: outro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, emblemTarget.scale],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent: the native launch background (the same nebula) shows until the image draws,
  // so there is no black frame between the launch screen and this one
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
  },
  fullScreen: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
