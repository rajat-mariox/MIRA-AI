import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import GradientBackground from '../components/GradientBackground';
import CosmicArt from '../components/CosmicArt';
import useAuthLayout from '../hooks/useAuthLayout';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { useOnboarding } from '../context/OnboardingContext';
import { sendOtp } from '../api/auth';
import { ApiError, errorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation, route }: Props) {
  // Coming from the splash: the artwork is already in place, so only the text and form fade up
  const fromSplash = !!route.params?.fromSplash;
  const reveal = useRef(new Animated.Value(fromSplash ? 0 : 1)).current;
  useEffect(() => {
    if (!fromSplash) return;
    Animated.timing(reveal, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fromSplash, reveal]);

  const { data, update } = useOnboarding();
  const layout = useAuthLayout(39);

  const [email, setEmail] = useState(data.email);
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);

  const onGetOtp = async () => {
    if (sending) return;
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError('Please enter a valid email id');
      return;
    }
    setError(undefined);
    setSending(true);
    try {
      await sendOtp(value);
      update({ email: value });
      navigation.navigate('Otp');
    } catch (e) {
      // Field error (validation) or the server message (rate limit, network...) under the field
      setError(
        (e instanceof ApiError && e.fieldError('email')) || errorMessage(e),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <KeyboardAwareScroll
        contentContainerStyle={[styles.content, layout.contentStyle]}
      >
        {/* Inside the scroll content; shrinks while the keyboard is open so nothing is cut off */}
        <CosmicArt scale={layout.artScale} />
        <Animated.View
          onLayout={layout.onFormLayout}
          style={{
            opacity: reveal,
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <View style={styles.intro}>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              You are on the path to discovering yourself. LunaFlame will help
              you live in harmony with the Universe.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Enter Your Email id"
              boxStyle={styles.emailBox}
              placeholder="Enter your email address"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (error) setError(undefined);
              }}
              error={error}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="done"
              onSubmitEditing={onGetOtp}
            />
            <Button
              title="Get OTP"
              onPress={onGetOtp}
              labelColor={colors.onPrimary}
              disabled={sending}
            />
          </View>
        </Animated.View>
      </KeyboardAwareScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  // Figma 7763:45657: the email field is pill-shaped (radius 58)
  emailBox: {
    borderRadius: 58,
  },
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  intro: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 37,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 40,
    lineHeight: 48,
    color: colors.white,
    textAlign: 'center',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(243, 254, 255, 0.48)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    includeFontPadding: false,
  },
  subtitle: {
    width: 297,
    maxWidth: '100%',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  form: {
    gap: 30,
    paddingHorizontal: 20,
  },
});
