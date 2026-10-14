import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import GlassCard from '../GlassCard';
import AddIcon from '../../assets/images/chat-add.svg';
import SendIcon from '../../assets/images/chat-send.svg';
import { cardGradients, colors, fonts } from '../../theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAdd?: () => void;
  /** space under the input row (home indicator / navigation bar, or 12 above the keyboard) */
  bottomInset: number;
};

// CSS angles and stops of the button / field fills in the design
const ADD_BUTTON_ANGLE = 94.5077;
const ADD_BUTTON_STOPS = [
  { offset: 0.24586, color: colors.white, opacity: 0.16 },
  { offset: 0.99762, color: colors.white, opacity: 0.08 },
];
const FIELD_ANGLE = 111.4245;

// Black bar at the bottom of the chat: + button, rounded text field and send button
export default function ChatInputBar({ value, onChangeText, onSend, onAdd, bottomInset }: Props) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset }]}>
      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add attachment">
        <GlassCard angle={ADD_BUTTON_ANGLE} stops={ADD_BUTTON_STOPS} style={styles.addButton}>
          <AddIcon width={24} height={24} />
        </GlassCard>
      </Pressable>
      <GlassCard angle={FIELD_ANGLE} stops={cardGradients.idle} style={styles.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask your cosmic question..."
          placeholderTextColor={colors.placeholder}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={onSend}
          selectionColor={colors.primary}
          style={styles.input}
        />
      </GlassCard>
      <Pressable
        onPress={onSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
        style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}
      >
        <SendIcon width={24} height={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
    paddingHorizontal: 24,
    // transparent: the screen's gradient runs down behind the input row to the tab bar
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
  },
  input: {
    // 16 in the design minus the 1dp border
    paddingHorizontal: 15,
    paddingVertical: 0,
    height: 42,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
