import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Button from '../Button';
import LogoutIcon from '../../assets/images/logout-icon.svg';
import { colors, fonts } from '../../theme';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

// Red fill of the "Yes, Logout" button in the design
const DANGER_FILL = '#FB2C36';

/**
 * Centred logout confirmation over a 60% black backdrop (Profile logout popup).
 * Tapping the backdrop or Android back cancels.
 */
export default function LogoutDialog({ visible, onConfirm, onCancel }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cancel" />
        <View style={styles.dialog} accessibilityViewIsModal>
          {/* Same blue-to-pink gradient + 40% black overlay as the screens */}
          <LinearGradient
            colors={[colors.gradientTop, colors.gradientBottom]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} />

          <View style={styles.iconCircle}>
            <LogoutIcon width={40} height={40} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>Logout</Text>
            <Text style={styles.message}>Are you sure you want to logout from your account?</Text>
          </View>
          <View style={styles.buttons}>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
            >
              <Text style={styles.confirmLabel} numberOfLines={1}>
                Yes, Logout
              </Text>
            </Pressable>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.cancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dialog: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: colors.gradientOverlay,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    // Figma: 16 padding with the 1dp stroke inside the 72dp circle
    padding: 15,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  texts: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0.0703,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  message: {
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  buttons: {
    alignSelf: 'stretch',
    gap: 12,
  },
  confirm: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 60,
    backgroundColor: DANGER_FILL,
    boxShadow:
      '0px 8px 8px rgba(37, 35, 118, 0.32), inset 0px 2px 6px 0px rgba(240, 240, 255, 0.8)',
  },
  confirmLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 18,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.85,
  },
  cancel: {
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
});
