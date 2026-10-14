import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import CheckboxChecked from '../assets/images/checkbox-checked.svg';
import { colors, fonts } from '../theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
  onPressTerms: () => void;
};

export default function AgreementCheckbox({ checked, onToggle, onPressTerms }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={styles.box}
      >
        {checked ? (
          // The Figma export is 56×56 with room for its shadow around the 24×24 circle
          <CheckboxChecked width={56} height={56} style={styles.checkedSvg} />
        ) : (
          <View style={styles.unchecked} />
        )}
      </Pressable>
      <Text style={styles.text}>
        {'By proceeding, you agree to our '}
        <Text style={styles.link} onPress={onPressTerms} accessibilityRole="link">
          {'Terms & Conditions.'}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  box: {
    width: 24,
    height: 24,
    overflow: 'visible',
  },
  checkedSvg: {
    position: 'absolute',
    left: -16,
    top: -8,
  },
  unchecked: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16.5,
    color: colors.white,
    includeFontPadding: false,
  },
  link: {
    fontFamily: fonts.bold,
    textDecorationLine: 'underline',
  },
});
