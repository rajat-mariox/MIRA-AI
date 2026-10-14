import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../GlassCard';
import Button from '../Button';
import { MENU_CARD_ANGLE } from './MenuRow';
import { colors, fonts } from '../../theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  /** shows a "Done" button that calls this; without it the sheet closes on selection */
  onDone?: () => void;
  children: React.ReactNode;
};

/**
 * Bottom sheet for the Edit Profile pickers (birth date, country code). Not in the
 * Figma file; styled with the same glass card and button as the rest of the screen.
 */
export default function PickerSheet({ visible, title, onClose, onDone, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <GlassCard angle={MENU_CARD_ANGLE} style={styles.sheet}>
            <Text style={styles.title}>{title}</Text>
            {children}
            {onDone && <Button title="Done" onPress={onDone} style={styles.button} />}
          </GlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetWrap: {
    paddingHorizontal: 20,
  },
  sheet: {
    padding: 15,
    gap: 16,
    borderRadius: 20,
    backgroundColor: colors.onPrimary,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    includeFontPadding: false,
  },
  button: {
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
});
