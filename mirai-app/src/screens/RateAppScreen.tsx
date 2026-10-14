import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import LikeIcon from '../assets/images/rate-like.svg';
import StarFilled from '../assets/images/rate-star-filled.svg';
import StarEmpty from '../assets/images/rate-star-empty.svg';
import { SettingDivider, SettingRow, settingCardStyle } from './PrivacySecurityScreen';
import { sendFeedback } from '../api/feedback';
import { errorMessage } from '../api/client';
import { colors, fonts } from '../theme';

const SUPPORT_EMAIL = 'Support@marai.com';
const PACKAGE_NAME = 'com.av.mirai';
const PLAY_STORE_URL = `market://details?id=${PACKAGE_NAME}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;
const SHARE_MESSAGE = `Discover your stars with MARAI, your personal astrology guide: ${PLAY_STORE_WEB_URL}`;

const STARS = [1, 2, 3, 4, 5];
// Line under the stars per rating; the design shows the 3-star text
const FEEDBACK: Record<number, string> = {
  1: '😞 Sorry to hear that. Tell us what went wrong',
  2: '😕 Not great. Tell us how we can do better',
  3: '👍 Good! Help us improve further',
  4: '😊 Great! Thanks for your support',
  5: '🤩 Awesome! We are glad you love MARAI',
};
const OTHER_WAYS = {
  share: { title: 'Share with Friends', subtitle: 'Help others discover Mirai' },
  feedback: { title: 'Send Feedback', subtitle: 'Share suggestions directly with us' },
};

// Star buttons are 47.994dp; the outlined star vector is 43.998×42.139 at (2, 2)
const STAR_BUTTON = 47.994;
const STAR_GAP = 11.996;
const STAR_VECTOR = { width: 43.9983, height: 42.139, offset: 2 };

// Card fill angles from the design
const THOUGHTS_FIELD_ANGLE = 104.79408011294699;
const OTHER_WAYS_CARD_ANGLE = 100.9895928061202;

const FIELD_TEXT_COLOR = 'rgba(255, 255, 255, 0.6)';

async function openUrl(url: string, fallback?: string) {
  try {
    await Linking.openURL(url);
  } catch {
    if (fallback) {
      openUrl(fallback);
    } else {
      Alert.alert('Unable to open', 'No app is available to handle this action.');
    }
  }
}

export default function RateAppScreen() {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [thoughts, setThoughts] = useState('');
  const [sending, setSending] = useState(false);

  // Keep the feedback field above the keyboard
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const thoughtsY = useRef(0);
  const focused = useRef(false);
  const scrollToField = useCallback(() => {
    if (!focused.current) return;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, thoughtsY.current - 24), animated: true }),
    );
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToField);

  const onSubmit = async () => {
    Keyboard.dismiss();
    if (sending) return;
    if (rating < 1) {
      Alert.alert('Choose a rating', 'Tap the stars to rate MARAI.');
      return;
    }
    const reset = () => {
      setRating(0);
      setThoughts('');
    };
    let result;
    setSending(true);
    try {
      // POST /feedback; the server decides whether to suggest a store review
      result = await sendFeedback(rating, thoughts.trim() || undefined);
    } catch (e) {
      Alert.alert('Could not send feedback', errorMessage(e));
      return;
    } finally {
      setSending(false);
    }
    if (result.data.promptStoreReview) {
      Alert.alert(
        'Feedback sent',
        `${result.message} Would you like to rate us on the Play Store too?`,
        [
          { text: 'Not now', style: 'cancel', onPress: reset },
          {
            text: 'Rate on Play Store',
            onPress: () => {
              reset();
              openUrl(PLAY_STORE_URL, PLAY_STORE_WEB_URL);
            },
          },
        ],
      );
    } else {
      Alert.alert('Feedback sent', result.message, [
        { text: 'OK', onPress: reset },
      ]);
    }
  };

  const onShare = () => {
    Share.share({ message: SHARE_MESSAGE }).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader title="Rate MARAI" />

      <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: (keyboardHeight > 0 ? 0 : insets.bottom) + 30 },
          ]}
        >
          <View style={styles.hero}>
            <View style={styles.likeCircle}>
              <LikeIcon width={40} height={40} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.title}>Enjoying MARAI?</Text>
              <Text style={styles.small}>Rate us and let us know what you think</Text>
            </View>
            <View style={styles.stars}>
              {STARS.map(value => {
                const Star = value <= rating ? StarFilled : StarEmpty;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setRating(value)}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} star${value > 1 ? 's' : ''}`}
                    accessibilityState={{ selected: value <= rating }}
                    style={styles.starButton}
                  >
                    <Star
                      width={STAR_VECTOR.width}
                      height={STAR_VECTOR.height}
                      style={styles.starVector}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {rating > 0 && (
            <>
              <Text style={styles.small}>{FEEDBACK[rating]}</Text>

              <View
                style={styles.thoughts}
                onLayout={e => {
                  thoughtsY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.thoughtsLabel} numberOfLines={1}>
                  Share your thoughts (optional)
                </Text>
                <GlassCard angle={THOUGHTS_FIELD_ANGLE} style={styles.thoughtsBox}>
                  <TextInput
                    value={thoughts}
                    onChangeText={setThoughts}
                    placeholder="What do you like most? How can we improve?"
                    placeholderTextColor={FIELD_TEXT_COLOR}
                    selectionColor={colors.primary}
                    multiline
                    textAlignVertical="top"
                    onFocus={() => {
                      focused.current = true;
                      if (keyboardHeight > 0) scrollToField();
                    }}
                    onBlur={() => {
                      focused.current = false;
                    }}
                    style={styles.thoughtsInput}
                    accessibilityLabel="Share your thoughts"
                  />
                </GlassCard>
              </View>

              <Button title="Submit Rating" onPress={onSubmit} disabled={sending} style={styles.button} />
            </>
          )}

          <Text style={styles.small}>Or help us in other ways</Text>

          <GlassCard angle={OTHER_WAYS_CARD_ANGLE} style={settingCardStyle}>
            <SettingRow {...OTHER_WAYS.share} onPress={onShare} />
            <SettingDivider />
            <SettingRow
              {...OTHER_WAYS.feedback}
              onPress={() => openUrl(`mailto:${SUPPORT_EMAIL}?subject=MARAI%20Feedback`)}
            />
          </GlassCard>
        </ScrollView>
      </View>
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
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  hero: {
    alignItems: 'center',
    gap: 24,
  },
  likeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    // Figma: 16 padding with the 1dp stroke inside the 72dp circle
    padding: 15,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  heroText: {
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
  small: {
    alignSelf: 'stretch',
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: STAR_GAP,
  },
  starButton: {
    width: STAR_BUTTON,
    height: STAR_BUTTON,
  },
  starVector: {
    position: 'absolute',
    left: STAR_VECTOR.offset,
    top: STAR_VECTOR.offset,
  },
  thoughts: {
    gap: 12,
  },
  thoughtsLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  thoughtsBox: {
    height: 100,
    // Figma: 16 padding with the 1dp stroke inside the box
    padding: 15,
  },
  thoughtsInput: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  button: {
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
});
