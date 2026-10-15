import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  /** extra style for the input box (e.g. the Welcome screen's pill-shaped field) */
  boxStyle?: StyleProp<ViewStyle>;
};

export default function TextField({
  label,
  error,
  style,
  boxStyle,
  ...inputProps
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, boxStyle, !!error && styles.boxError]}>
        <TextInput
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          {...inputProps}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  box: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.636,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
  },
  boxError: {
    borderColor: '#FF8A8A',
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    padding: 0,
    includeFontPadding: false,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16.5,
    color: '#FFB4B4',
  },
});
