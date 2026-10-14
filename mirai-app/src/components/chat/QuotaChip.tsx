import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../GlassCard';
import ChatIcon from '../../assets/images/plans-chat.svg';
import ChevronRight from '../../assets/images/icon-chevron-right.svg';
import type { ChatQuota } from '../../api/chat';
import { colors, fonts, MONTHS } from '../../theme';

type Props = {
  quota: ChatQuota;
  onPress: () => void;
};

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/** "1 free question left" / "3 questions left · 5 Questions" / "Unlimited · till 21 Oct" */
export function quotaLabel(q: ChatQuota): string {
  if (q.freeRemaining > 0) {
    return `${q.freeRemaining} free ${q.freeRemaining === 1 ? 'question' : 'questions'} left`;
  }
  const sub = q.subscription;
  if (!sub) return 'No questions left';
  if (sub.questionsRemaining === null) {
    return sub.expiresAt ? `Unlimited · till ${shortDate(sub.expiresAt)}` : `Unlimited · ${sub.title}`;
  }
  const n = sub.questionsRemaining;
  return `${n} ${n === 1 ? 'question' : 'questions'} left · ${sub.title}`;
}

/**
 * Questions left above the chat input. While the user can ask it is a small glass pill with a
 * "Plans" link; once they are out it becomes a card inviting them to pick a plan.
 * Both open the Plans screen.
 */
export default function QuotaChip({ quota, onPress }: Props) {
  const label = quotaLabel(quota);

  if (!quota.canAsk) {
    const usedFree = quota.freeLimit > 0 && !quota.subscription;
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Questions used up. View plans"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <GlassCard angle={98.28} style={styles.card}>
          <View style={styles.iconCircle}>
            <ChatIcon width={20} height={20} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {usedFree ? 'Free question used' : 'Your plan has ended'}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              Choose a plan to keep chatting
            </Text>
          </View>
          <View style={styles.cardButton}>
            <Text style={styles.cardButtonText}>View Plans</Text>
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. View plans`}
      hitSlop={6}
      style={({ pressed }) => [styles.chipWrap, pressed && styles.pressed]}
    >
      <GlassCard angle={98.28} style={styles.chip}>
        <ChatIcon width={14} height={14} />
        <Text style={styles.chipLabel} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.chipDivider} />
        <Text style={styles.chipLink}>Plans</Text>
        <ChevronRight width={12} height={12} style={styles.chipChevron} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  // Out of questions: full-width glass card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingLeft: 11,
    paddingRight: 11,
    borderRadius: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 216, 242, 0.16)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  cardButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  cardButtonText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.onPrimary,
    includeFontPadding: false,
  },
  // Questions left: compact pill
  chipWrap: {
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 50,
  },
  chipLabel: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  chipDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.cardBorder,
  },
  chipLink: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
  chipChevron: {
    marginLeft: -2,
    opacity: 0.9,
  },
});
