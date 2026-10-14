import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextLayoutEvent,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fonts } from '../theme';

type Props = {
  /** a string, or rich content (then pass the plain text as `text`) */
  children: React.ReactNode;
  /** plain text of `children`; identifies the content when children isn't a string */
  text?: string;
  /** text style (font, size, lineHeight, color) */
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** lines shown at first, and how many more each "Read more" reveals */
  lines?: number;
};

/**
 * Long paragraph that starts at a few lines; each "Read more" shows a few lines more, and
 * once it is all visible "Read less" folds it back. Short text renders as plain text.
 */
export default function ExpandableText({ children, text, style, containerStyle, lines = 4 }: Props) {
  const content = text ?? (typeof children === 'string' ? children : '');
  // Both are tied to the text they belong to, so new text (another sign, period or tab)
  // starts folded again without an effect racing the measurement
  const [measured, setMeasured] = useState({ text: '', total: 0 });
  const [shown, setShown] = useState({ text: content, visible: lines });
  const totalLines = measured.text === content ? measured.total : 0;
  const visible = shown.text === content ? shown.visible : lines;
  const setVisible = (v: number) => setShown({ text: content, visible: v });

  // An invisible full copy measures how many lines the text needs at this width
  const onMeasure = (e: TextLayoutEvent) => {
    setMeasured({ text: content, total: e.nativeEvent.lines.length });
  };

  const overflowing = totalLines > lines;
  const fullyShown = visible >= totalLines;

  return (
    <View style={containerStyle}>
      <Text style={[style, styles.measure]} onTextLayout={onMeasure} aria-hidden importantForAccessibility="no-hide-descendants">
        {children}
      </Text>
      <Text style={style} numberOfLines={overflowing && !fullyShown ? visible : undefined}>
        {children}
      </Text>
      {overflowing && (
        <Pressable
          onPress={() => setVisible(fullyShown ? lines : visible + lines)}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.toggle}
        >
          <Text style={styles.toggleText}>{fullyShown ? 'Read less' : 'Read more'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  toggleText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
});
