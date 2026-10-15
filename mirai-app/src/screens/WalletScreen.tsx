import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SvgProps } from 'react-native-svg';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import MenuRow from '../components/profile/MenuRow';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import type { RootStackParamList } from '../navigation/types';
import WalletIcon from '../assets/images/wallet-empty-wallet.svg';
import SparkleIcon from '../assets/images/wallet-sparkle.svg';
import MoneysIcon from '../assets/images/wallet-moneys.svg';
import CardsIcon from '../assets/images/wallet-cards.svg';
import CardIcon from '../assets/images/wallet-card.svg';
import ChevronRight from '../assets/images/wallet-chevron-right.svg';
import { ErrorCard } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getWallet, recharge, type PaymentMethodId } from '../api/wallet';
import { ApiError, errorMessage } from '../api/client';
import { rechargeWithStripe } from '../utils/stripePayment';
import { useSession } from '../context/OnboardingContext';
import { cardGradients, colors, fonts } from '../theme';

// Fill angles come from the individual pills in the design (₹399 is drawn selected,
// so its idle angle is the average of the others); amounts come from GET /wallet
const PILL_ANGLES = [97.99960926967817, 98.1, 98.1921042739608, 98.0958797704061];
const DESIGN_AMOUNTS = [99, 399, 499, 999];
const DEFAULT_QUICK_AMOUNT = 399;

const METHOD_ICONS: Record<PaymentMethodId, React.FC<SvgProps>> = {
  upi: MoneysIcon,
  card: CardsIcon,
  netbanking: CardIcon,
};
function paymentErrorMessage(e: unknown): string {
  if (!(e instanceof ApiError) && e instanceof Error && e.message) return e.message;
  return errorMessage(e);
}

const DESIGN_METHODS: { id: PaymentMethodId; title: string; subtitle: string }[] = [
  { id: 'upi', title: 'UPI Payment', subtitle: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', title: 'Credit / Debit Card', subtitle: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', title: 'Net Banking', subtitle: 'All major banks' },
];

export default function WalletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();

  const { refreshUser, user } = useSession();
  const [quickAmount, setQuickAmount] = useState<number | null>(DEFAULT_QUICK_AMOUNT);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethodId | null>(null);
  const [paying, setPaying] = useState(false);

  const wallet = useApi(getWallet, []);
  const w = wallet.data;
  // Refetch when coming back (e.g. from the history screen); the first focus is the initial load
  const focused = useRef(false);
  const { reload } = wallet;
  useFocusEffect(
    useCallback(() => {
      if (focused.current) reload();
      focused.current = true;
    }, [reload]),
  );

  const quickAmounts = (w?.quickRechargeOptions.map(o => o.amount) ?? DESIGN_AMOUNTS).map((value, i) => ({
    value,
    angle: PILL_ANGLES[i] ?? PILL_ANGLES[1],
    // The design fixes the first pill's label width
    labelWidth: i === 0 ? 50 : undefined,
  }));
  const methods = (w?.paymentMethods.filter(m => m.isEnabled) ?? DESIGN_METHODS).map(m => ({
    id: m.id,
    title: m.title,
    subtitle: m.subtitle,
    Icon: METHOD_ICONS[m.id] ?? CardIcon,
  }));

  // Keep the custom amount field above the keyboard
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  // y of the content block in the scroll view, and of the custom amount section in it
  const contentY = useRef(0);
  const customY = useRef(0);
  const scrollToInput = useCallback(() => {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, contentY.current + customY.current - 24), animated: true }),
    );
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToInput);

  const amount = quickAmount ?? Number(customAmount || 0);
  const hasCustomAmount = Number(customAmount || 0) > 0;

  const onChangeAmount = (text: string) => {
    setCustomAmount(text.replace(/[^0-9]/g, '').replace(/^0+/, ''));
    setQuickAmount(null);
  };

  const onSelectQuickAmount = (value: number) => {
    setQuickAmount(value);
    setCustomAmount('');
  };

  const onRecharge = async () => {
    if (paying) return;
    if (!(amount > 0)) {
      Alert.alert('Enter an amount', 'Please choose or enter an amount greater than ₹0.');
      return;
    }
    if (w && (amount < w.minRechargeAmount || amount > w.maxRechargeAmount)) {
      Alert.alert(
        'Invalid amount',
        `Please enter an amount between ${w.currencySymbol}${w.minRechargeAmount} and ${w.currencySymbol}${w.maxRechargeAmount}.`,
      );
      return;
    }
    setPaying(true);
    try {
      // Stripe PaymentSheet shows the methods the Stripe account enables (card, UPI, ...).
      // 'simulated' = Stripe isn't configured on the server (local development).
      if (w?.payments?.provider === 'simulated') {
        await simulatedRecharge();
        return;
      }
      const result = await rechargeWithStripe(amount, { email: user?.email, name: user?.fullName });
      if (result.outcome === 'canceled') return;
      const { status } = result.confirmation;
      setCustomAmount('');
      reload();
      refreshUser();
      if (status === 'succeeded') Alert.alert('Recharge successful', result.message);
      else if (status === 'processing') Alert.alert('Payment processing', result.message);
      else Alert.alert('Payment not completed', result.message);
    } catch (e) {
      Alert.alert('Recharge failed', paymentErrorMessage(e));
    } finally {
      setPaying(false);
    }
  };

  // Development fallback: the backend credits the wallet without a real payment
  const simulatedRecharge = async () => {
    if (!method) {
      Alert.alert('Choose a payment method', 'Please select UPI, card or net banking below.');
      return;
    }
    const { message } = await recharge(amount, method);
    setCustomAmount('');
    reload();
    refreshUser();
    Alert.alert('Recharge successful', message);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      <View style={[styles.root, styles.transparent, { paddingBottom: keyboardHeight }]}>
        <ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 21) + 14 }}
        >
          <ScreenHeader title="My Wallet" />

          <View
            style={styles.content}
            onLayout={e => {
              contentY.current = e.nativeEvent.layout.y;
            }}
          >
            {/* Balance */}
            {wallet.error && !w ? (
              <ErrorCard error={wallet.error} onRetry={reload} />
            ) : (
            <GlassCard angle={101.8380389954948} style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceText}>
                  <Text style={styles.balanceLabel}>{w?.balanceLabel ?? 'Available Balance'}</Text>
                  <Text style={styles.balanceAmount} numberOfLines={1}>
                    {w?.balanceText ?? '₹ --'}
                  </Text>
                </View>
                <View style={styles.walletIcon}>
                  <WalletIcon width={28} height={28} />
                </View>
              </View>
              <View style={styles.lastRecharged}>
                <SparkleIcon width={16} height={16} />
                <Text style={styles.lastRechargedText} numberOfLines={1}>
                  {w?.lastRechargeText ?? ' '}
                </Text>
              </View>
            </GlassCard>
            )}

            <Button title={paying ? 'Processing…' : 'Recharge Wallet'} onPress={onRecharge} disabled={paying} />

            {/* Quick recharge */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Quick Recharge
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pillScroll}
                contentContainerStyle={styles.pills}
              >
                {quickAmounts.map(q => {
                  const selected = quickAmount === q.value;
                  const label = (
                    <Text
                      style={[
                        styles.pillLabel,
                        selected && styles.pillLabelSelected,
                        q.labelWidth ? { width: q.labelWidth } : null,
                      ]}
                    >
                      ₹{q.value}
                    </Text>
                  );
                  return (
                    <Pressable
                      key={q.value}
                      onPress={() => onSelectQuickAmount(q.value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`₹${q.value}`}
                    >
                      {selected ? (
                        <View style={[styles.pill, styles.pillSelected]}>{label}</View>
                      ) : (
                        <GlassCard angle={q.angle} style={[styles.pill, styles.pillIdle]}>
                          {label}
                        </GlassCard>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Custom amount */}
            <View
              style={styles.section}
              onLayout={e => {
                customY.current = e.nativeEvent.layout.y;
              }}
            >
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Custom Amount
              </Text>
              <View style={styles.customRow}>
                <GlassCard angle={110.75769072118678} style={styles.inputCard}>
                  <View style={styles.inputRow}>
                    <Text style={[styles.rupee, hasCustomAmount && styles.rupeeActive]}>₹</Text>
                    <TextInput
                      value={customAmount}
                      onChangeText={onChangeAmount}
                      onFocus={scrollToInput}
                      placeholder="Enter amount"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={7}
                      selectionColor={colors.primary}
                      style={styles.input}
                      accessibilityLabel="Custom amount"
                    />
                  </View>
                </GlassCard>
                <Pressable
                  onPress={onRecharge}
                  disabled={paying}
                  accessibilityRole="button"
                  accessibilityLabel="Go"
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <GlassCard angle={95.9719570983369} style={styles.goButton}>
                    <Text style={[styles.goLabel, hasCustomAmount && styles.goLabelActive]}>
                      GO
                    </Text>
                  </GlassCard>
                </Pressable>
              </View>
            </View>

            {/* Payment methods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle} numberOfLines={1}>
                Payment Methods
              </Text>
              <View style={styles.methods}>
                {methods.map(m => {
                  const selected = method === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => setMethod(m.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={m.title}
                      style={({ pressed }) => pressed && styles.pressed}
                    >
                      <GlassCard
                        angle={110.14337849377281}
                        stops={selected ? cardGradients.selected : cardGradients.idle}
                        borderColor={selected ? colors.primary : colors.cardBorder}
                        style={styles.methodCard}
                      >
                        <View style={styles.methodLead}>
                          <View style={styles.methodIcon}>
                            <m.Icon width={24} height={24} />
                          </View>
                          <View style={styles.methodText}>
                            <Text style={styles.methodTitle} numberOfLines={1}>
                              {m.title}
                            </Text>
                            <Text style={styles.methodSubtitle} numberOfLines={1}>
                              {m.subtitle}
                            </Text>
                          </View>
                        </View>
                        <ChevronRight width={24} height={24} style={styles.chevron} />
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <MenuRow
              label="View Transaction History"
              icon={null}
              trailing={<ChevronRight width={24} height={24} style={styles.chevron} />}
              onPress={() => navigation.navigate('WalletHistory')}
            />
          </View>
        </ScrollView>
      </View>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  // Card paddings are the design value minus the 1px border
  balanceCard: {
    padding: 15,
    gap: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  balanceText: {
    flex: 1,
    gap: 2,
  },
  balanceLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  balanceAmount: {
    fontFamily: fonts.bold,
    fontSize: 38,
    lineHeight: 46,
    color: colors.white,
    includeFontPadding: false,
  },
  walletIcon: {
    padding: 11,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  lastRecharged: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastRechargedText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: '#FF932A',
    includeFontPadding: false,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  // The pill row runs past the page padding to the screen edges
  pillScroll: {
    marginHorizontal: -20,
  },
  pills: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
  },
  pillIdle: {
    paddingHorizontal: 15,
    paddingVertical: 7,
  },
  pillSelected: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
  },
  pillLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  pillLabelSelected: {
    color: colors.black,
  },
  customRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputCard: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  rupee: {
    width: 20,
    fontFamily: fonts.medium,
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    color: colors.placeholder,
    includeFontPadding: false,
  },
  rupeeActive: {
    color: colors.white,
  },
  input: {
    flex: 1,
    height: 28,
    padding: 0,
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  goButton: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 21,
  },
  goLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: colors.placeholder,
    includeFontPadding: false,
  },
  goLabelActive: {
    color: colors.white,
  },
  methods: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  methodLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  methodIcon: {
    padding: 11,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  methodText: {
    flexShrink: 1,
    gap: 2,
  },
  methodTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  methodSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  chevron: {
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.8,
  },
});
