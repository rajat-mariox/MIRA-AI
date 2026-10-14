import React, { useCallback, useRef } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import useKeyboardHeight from '../hooks/useKeyboardHeight';

type Props = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

// Scroll view that shrinks above the keyboard and scrolls its bottom content into view
export default function KeyboardAwareScroll({ children, contentContainerStyle }: Props) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToEnd);

  return (
    <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
