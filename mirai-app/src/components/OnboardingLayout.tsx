import React, { useCallback, useRef } from 'react';
import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from './GradientBackground';
import OnboardingHeader from './OnboardingHeader';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import { colors } from '../theme';

type Props = {
  title: string;
  step: number;
  description: string;
  descriptionOpacity?: number;
  children?: React.ReactNode;
  footer: React.ReactNode;
};

// In the 375×812 frames the footer ends 49px above the bottom edge,
// or 27px above the keyboard when it is open.
const FOOTER_BOTTOM = 49;
const FOOTER_ABOVE_KEYBOARD = 27;

/**
 * Shared onboarding scaffold: gradient background, header, scrollable body and a
 * footer pinned to the bottom (or above the keyboard). Extra height on tall
 * screens goes between the body and the footer; short screens scroll.
 */
export default function OnboardingLayout({
  title,
  step,
  description,
  descriptionOpacity,
  children,
  footer,
}: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToEnd);

  return (
    <View style={[styles.root, { paddingBottom: keyboardHeight }]}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <OnboardingHeader
        title={title}
        step={step}
        description={description}
        descriptionOpacity={descriptionOpacity}
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.body}>{children}</View>
        <View
          style={[
            styles.footer,
            {
              paddingBottom:
                keyboardHeight > 0
                  ? FOOTER_ABOVE_KEYBOARD
                  : Math.max(FOOTER_BOTTOM, insets.bottom),
            },
          ]}
        >
          {footer}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  body: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 20,
  },
});
