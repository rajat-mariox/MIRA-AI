import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SvgProps } from 'react-native-svg';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import { ErrorCard, LoadingView } from '../components/StateViews';
import ChatIcon from '../assets/images/plans-chat.svg';
import CallIcon from '../assets/images/plans-call.svg';
import GiftIcon from '../assets/images/plans-gift.svg';
import StarIcon from '../assets/images/plans-star.svg';
import TickCircle from '../assets/images/plans-tick-circle.svg';
import useApi from '../hooks/useApi';
import { getPlans, insufficientBalance, purchasePlan, type Plan } from '../api/plans';
import { getChatQuota } from '../api/chat';
import { errorMessage } from '../api/client';
import { useSession } from '../context/OnboardingContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

// Card fill angles from the design (plain, most popular, free question)
const CARD_ANGLE = 105.69315219685721;
const POPULAR_CARD_ANGLE = 101.48361525776659;
const FREE_CARD_ANGLE = 107.45344969695375;
const SELECT_ANGLE = 101.82730722883821;
const ORANGE = '#FF932A';

// Static trust row under the plans; the label widths make them wrap onto two lines as drawn
const TRUST_BADGES = [
  { label: '100% Secure', width: 53 },
  { label: 'Verified Experts', width: 60 },
  { label: 'Instant Connect', width: 60 },
];

// Plan.icon from the admin panel -> icon in the circle
function planIcon(icon: string | undefined): React.FC<SvgProps> {
  const key = (icon ?? '').toLowerCase();
  if (key.includes('call') || key.includes('phone') || key.includes('voice')) return CallIcon;
  return ChatIcon;
}

const money = (plan: Plan, value: number) => `${plan.currencySymbol || '₹'}${value}`;

export default function PlansScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { scrolled, onScroll } = useScrolledFromTop();
  const { refreshUser } = useSession();
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const plans = useApi(getPlans, []);
  const quota = useApi(getChatQuota, []);
  const freeRemaining = quota.data?.freeRemaining ?? 0;

  const buy = async (plan: Plan) => {
    setBuyingId(plan.id);
    try {
      const { message } = await purchasePlan(plan.id);
      refreshUser();
      Alert.alert('Plan activated', message, [{ text: 'Start chatting', onPress: () => navigation.goBack() }], {
        cancelable: false,
      });
    } catch (e) {
      const lack = insufficientBalance(e);
      if (lack) {
        Alert.alert(
          'Insufficient balance',
          `${plan.title} costs ${money(plan, lack.price || plan.price)} and your wallet has ${money(plan, lack.balance)}. Recharge your wallet to buy this plan.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Recharge Wallet', onPress: () => navigation.navigate('Wallet') },
          ],
        );
      } else {
        Alert.alert('Purchase failed', errorMessage(e));
      }
    } finally {
      setBuyingId(null);
    }
  };

  const onSelect = (plan: Plan) => {
    if (buyingId) return;
    Alert.alert('Confirm purchase', `Buy ${plan.title} for ${money(plan, plan.price)} from your wallet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy', onPress: () => buy(plan) },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 21) + 30 }}
      >
        <ScreenHeader title="Choose Your Plan" />

        <View style={styles.content}>
          <Text style={styles.subtitle}>Ask questions & get expert guidance from verified astrologers</Text>

          {plans.error && !plans.data ? (
            <ErrorCard error={plans.error} onRetry={plans.reload} />
          ) : !plans.data ? (
            <LoadingView size="large" />
          ) : (
            <View style={styles.list}>
              {plans.data.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  busy={buyingId === plan.id}
                  disabled={!!buyingId}
                  onSelect={() => onSelect(plan)}
                />
              ))}

              {freeRemaining > 0 && (
                <GlassCard angle={FREE_CARD_ANGLE} style={[styles.card, styles.row, styles.centered]}>
                  <View style={styles.lead}>
                    <View style={styles.iconCircle}>
                      <GiftIcon width={28} height={28} />
                    </View>
                    <View style={styles.texts}>
                      <Text style={styles.title} numberOfLines={1}>
                        {freeRemaining} Free {freeRemaining === 1 ? 'Question' : 'Questions'}
                      </Text>
                      <Text style={styles.feature}>First-time users only</Text>
                    </View>
                  </View>
                  <FilledPill label="Claim" onPress={() => navigation.goBack()} />
                </GlassCard>
              )}
            </View>
          )}

          <View style={styles.trustRow}>
            {TRUST_BADGES.map(b => (
              <View key={b.label} style={styles.trustItem}>
                <TickCircle width={24} height={24} />
                <Text style={[styles.trustLabel, { width: b.width }]}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function PlanCard({
  plan,
  busy,
  disabled,
  onSelect,
}: {
  plan: Plan;
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const popular = !!plan.badge;
  const Icon = planIcon(plan.icon);
  const strike = plan.originalPrice !== undefined && plan.originalPrice > plan.price ? plan.originalPrice : null;
  const action = busy ? '…' : plan.actionText || 'Select';

  const body = (
    <View style={[styles.row, popular ? styles.centered : styles.bottom]}>
      <View style={styles.lead}>
        <View style={styles.iconCircle}>
          <Icon width={28} height={28} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {plan.title}
          </Text>
          <View>
            {!!plan.validityText && (
              <Text style={styles.validity} numberOfLines={1}>
                {plan.validityText}
              </Text>
            )}
            {!!plan.featureHighlight && (
              <Text style={styles.feature} numberOfLines={1}>
                {plan.featureHighlight}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.priceCol}>
        <View style={styles.prices}>
          {strike !== null && <Text style={styles.strike}>{money(plan, strike)}</Text>}
          <Text style={styles.price}>{money(plan, plan.price)}</Text>
        </View>
        {popular ? (
          <FilledPill label={action} onPress={onSelect} disabled={disabled} />
        ) : (
          <Pressable
            onPress={onSelect}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${action} ${plan.title}`}
            style={({ pressed }) => (pressed || disabled) && styles.pressed}
          >
            <GlassCard angle={SELECT_ANGLE} style={styles.glassPill}>
              <Text style={styles.glassPillLabel}>{action}</Text>
            </GlassCard>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (!popular) {
    return (
      <GlassCard angle={CARD_ANGLE} style={styles.card}>
        {body}
      </GlassCard>
    );
  }
  return (
    <GlassCard angle={POPULAR_CARD_ANGLE} style={[styles.card, styles.popularCard]}>
      <View style={styles.badge}>
        <StarIcon width={12} height={12} />
        <Text style={styles.badgeLabel}>{plan.badge!.toUpperCase()}</Text>
      </View>
      {body}
    </GlassCard>
  );
}

// Primary pill with a drop shadow and inner highlight ("Select" on the popular plan, "Claim")
function FilledPill({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.filledPill, (pressed || disabled) && styles.pressed]}
    >
      <Text style={styles.filledPillLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  list: {
    gap: 10,
  },
  // Card paddings are the design value minus the 1px border
  card: {
    padding: 15,
  },
  popularCard: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  bottom: {
    alignItems: 'flex-end',
  },
  centered: {
    alignItems: 'center',
  },
  lead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  iconCircle: {
    padding: 11,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  texts: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  validity: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  feature: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: ORANGE,
    includeFontPadding: false,
  },
  priceCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  prices: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strike: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    includeFontPadding: false,
  },
  price: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  glassPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 19,
    paddingVertical: 5,
    borderRadius: 50,
  },
  glassPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  filledPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 7,
    borderRadius: 60,
    backgroundColor: colors.primary,
    boxShadow: '0px 8px 8px rgba(37, 35, 118, 0.32), inset 0px 2px 6px 0px rgba(240, 240, 255, 0.8)',
  },
  filledPillLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.black,
    includeFontPadding: false,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  badgeLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: '#292D32',
    includeFontPadding: false,
  },
  trustRow: {
    flexDirection: 'row',
  },
  trustItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  trustLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
  },
});
