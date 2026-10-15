import React, { useEffect, useState } from 'react';
import {
  Pressable,
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
import Button from '../components/Button';
import OtpBoxes from '../components/OtpBoxes';
import SmsIcon from '../assets/images/icon-sms.svg';
import type { RootStackParamList } from '../navigation/types';
import { routesForUser } from '../navigation/navigationRef';
import { useSession } from '../context/OnboardingContext';
import { sendOtp, verifyOtp } from '../api/auth';
import { errorMessage } from '../api/client';
import { colors, fonts } from '../theme';

// Must match OTP_LENGTH in the backend .env
const OTP_LENGTH = 6;
const RESEND_AFTER_SECONDS = 60;

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function OtpScreen({ navigation }: Props) {
  const layout = useAuthLayout(41);

  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_SECONDS);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const { data, signIn } = useSession();

  useEffect(() => {
    if (secondsLeft === 0) return;
    const id = setTimeout(() => setSecondsLeft(v => v - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const onResend = async () => {
    if (secondsLeft > 0 || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await sendOtp(data.email);
      setCode('');
      setSecondsLeft(RESEND_AFTER_SECONDS);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (busy) return;
    if (code.length < OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH} digit code`);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      // Terms were accepted on the Welcome screen (the Get OTP button requires it)
      const res = await verifyOtp(data.email, code, true);
      await signIn(
        { accessToken: res.accessToken, refreshToken: res.refreshToken },
        res.user,
      );
      // New / incomplete users continue onboarding where they left off; others go Home
      const routes = routesForUser(res.user);
      navigation.reset({ index: routes.length - 1, routes });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
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
        <View style={styles.form} onLayout={layout.onFormLayout}>
          <View>
            <Text style={styles.title}>OTP Verification</Text>
            <Text style={styles.subtitle}>
              A {OTP_LENGTH} digit code has been sent to your Email id
            </Text>
          </View>

          <View style={styles.otpBlock}>
            <OtpBoxes
              value={code}
              onChange={next => {
                setCode(next);
                if (error) setError(undefined);
              }}
              length={OTP_LENGTH}
              error={!!error}
              autoFocus
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Text style={styles.timer}>{formatSeconds(secondsLeft)}</Text>
            <View style={styles.resendRow}>
              <Text style={styles.resendHint}>
                If you din't receive a code!
              </Text>
              <Pressable
                onPress={onResend}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={styles.resend}>Resend</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Submit"
              onPress={onSubmit}
              disabled={busy}
              style={styles.fullWidth}
            />
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              style={styles.changeEmail}
            >
              <SmsIcon width={22} height={22} />
              <Text style={styles.changeEmailText}>Change Email ID</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAwareScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  form: {
    gap: 42,
  },
  title: {
    marginBottom: 4,
    fontFamily: fonts.medium,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  otpBlock: {
    gap: 16,
    alignItems: 'center',
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16.5,
    color: '#FFB4B4',
  },
  timer: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  resendRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  resend: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
  actions: {
    gap: 20,
    alignItems: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  changeEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  changeEmailText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 18,
    color: colors.white,
    textDecorationLine: 'underline',
    includeFontPadding: false,
  },
});
