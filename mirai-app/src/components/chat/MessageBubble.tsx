import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import ExpandableText from '../ExpandableText';
import { colors, fonts } from '../../theme';

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
};

type Props = { message: ChatMessage };

/**
 * Chat bubble with its time underneath. Assistant bubbles sit on the left with a
 * square bottom-left corner; user bubbles mirror that on the right with a primary tint.
 */
export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.wrap, isUser && styles.wrapUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {isUser ? (
          <Text style={styles.text}>{withSmallerEmoji(message.text)}</Text>
        ) : (
          // Long AI answers start folded; "Read more" reveals a few lines at a time
          <ExpandableText style={styles.text} text={message.text} lines={6}>
            {withSmallerEmoji(message.text)}
          </ExpandableText>
        )}
      </View>
      {!!message.time && <Text style={styles.time}>{message.time}</Text>}
    </View>
  );
}

// Android's emoji glyphs are wider than the Apple ones in the design, which pushes
// words onto the next line; draw them a little smaller there to keep the design's wrapping
const EMOJI = /([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?)/u;

function withSmallerEmoji(text: string) {
  if (Platform.OS !== 'android') return text;
  return text.split(EMOJI).map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={styles.emoji}>
        {part}
      </Text>
    ) : (
      part
    ),
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 12,
  },
  wrap: {
    alignItems: 'flex-start',
    gap: 8,
  },
  wrapUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: 280,
    // 16 / 12 in the design minus the 1dp border
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    boxShadow: '0px 2px 8px rgba(255, 255, 255, 0.1)',
  },
  bubbleAssistant: {
    // Figma stacks 10% white and 20% black fills; this single colour composites the same
    backgroundColor: 'rgba(73, 73, 73, 0.28)',
    borderColor: colors.cardBorder,
    borderBottomRightRadius: 16,
  },
  bubbleUser: {
    backgroundColor: 'rgba(167, 216, 242, 0.24)',
    borderColor: 'rgba(167, 216, 242, 0.4)',
    borderBottomLeftRadius: 16,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  time: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 0.5,
    color: colors.textMuted,
    includeFontPadding: false,
  },
});
