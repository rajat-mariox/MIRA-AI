import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length: number;
  error?: boolean;
  autoFocus?: boolean;
};

const ERROR = '#FF6467';

/**
 * OTP entry: one glass box per digit over a single hidden input (typing, paste and SMS
 * autofill all work). The next box to fill is highlighted with a blinking caret.
 */
export default function OtpBoxes({
  value,
  onChange,
  length,
  error,
  autoFocus,
}: Props) {
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);
  const caret = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caret, {
          toValue: 0,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(caret, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [caret]);

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Pressable
      style={styles.row}
      onPress={() => inputRef.current?.focus()}
      accessible={false}
    >
      {Array.from({ length }, (_, i) => {
        const digit = value[i] ?? '';
        const isActive = focused && i === activeIndex && value.length < length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              !!digit && styles.boxFilled,
              isActive && styles.boxActive,
              error && styles.boxError,
            ]}
          >
            {digit ? (
              <Text style={styles.digit}>{digit}</Text>
            ) : isActive ? (
              <Animated.View style={[styles.caret, { opacity: caret }]} />
            ) : null}
          </View>
        );
      })}
      {/* Invisible input over the boxes */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={t => onChange(t.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel="One time password"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  box: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  boxFilled: {
    borderColor: 'rgba(167, 216, 242, 0.55)',
    backgroundColor: 'rgba(167, 216, 242, 0.12)',
  },
  boxActive: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'rgba(167, 216, 242, 0.16)',
    boxShadow: '0px 0px 12px rgba(167, 216, 242, 0.45)',
  },
  boxError: {
    borderColor: ERROR,
    backgroundColor: 'rgba(255, 100, 103, 0.10)',
  },
  digit: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.white,
    includeFontPadding: false,
  },
  caret: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    opacity: 0.01,
  },
});
