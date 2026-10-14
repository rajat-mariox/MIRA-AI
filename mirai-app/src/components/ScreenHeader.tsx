import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ChevronRight from '../assets/images/icon-chevron-right.svg';
import { colors, DESIGN_STATUS_BAR, fonts } from '../theme';

type Props = {
  title: string;
  onBack?: () => void;
  /** extra content on the right of the title row */
  right?: React.ReactNode;
};

/**
 * Back button + uppercase title with a divider underneath. Starts 16dp below the
 * status bar (y = 62 in the 375×812 frames).
 */
export default function ScreenHeader({ title, onBack, right }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, DESIGN_STATUS_BAR) + 16 }]}>
      <View style={styles.container}>
        <Pressable
          onPress={onBack ?? (() => navigation.goBack())}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <ChevronRight width={20} height={20} style={styles.backIcon} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // 17 in Figma, where the 1dp divider sits inside the box
    paddingBottom: 16,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
  },
  backButton: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.iconButton,
  },
  backIcon: {
    opacity: 0.8,
    // The design uses chevron-right mirrored horizontally
    transform: [{ scaleX: -1 }],
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 20,
    lineHeight: 24,
    color: colors.white,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
