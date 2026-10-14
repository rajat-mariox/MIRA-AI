import React, { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import type { RootStackParamList } from '../navigation/types';
import DebitIcon from '../assets/images/wallet-export-debit.svg';
import CreditIcon from '../assets/images/wallet-export-credit.svg';
import { EmptyText, ErrorCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getTransactions, type Transaction, type TransactionFilter } from '../api/wallet';
import { colors, fonts } from '../theme';

type Filter = TransactionFilter;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'recharge', label: 'Recharge' },
  { id: 'usage', label: 'Usage' },
];

const TYPE_STYLE = {
  debit: { Icon: DebitIcon, tint: 'rgba(251, 44, 54, 0.2)', color: '#FF6467', label: 'Debit' },
  credit: { Icon: CreditIcon, tint: 'rgba(0, 201, 80, 0.2)', color: '#05DF72', label: 'Credit' },
};

export default function WalletHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  // GET /wallet/transactions?type=... (grouped by IST day on the server)
  const history = useApi(() => getTransactions(filter, 1, 50), [filter]);
  const groups = history.data?.groups ?? [];

  const onRecharge = () => {
    // Opened from the Wallet screen: go back instead of stacking another Wallet
    const { routes, index } = navigation.getState();
    if (routes[index - 1]?.name === 'Wallet') {
      navigation.goBack();
    } else {
      navigation.navigate('Wallet');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 21) + 24 }}
      >
        <ScreenHeader title="My Wallet" />

        <View style={styles.content}>
          {/* Balance */}
          <GlassCard angle={105.08237252216126} style={styles.balanceCard}>
            <View style={styles.balanceText}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount} numberOfLines={1}>
                {history.data?.balanceText ?? '₹ --'}
              </Text>
            </View>
            <Pressable
              onPress={onRecharge}
              accessibilityRole="button"
              accessibilityLabel="Recharge"
              style={({ pressed }) => [styles.rechargeButton, pressed && styles.pressed]}
            >
              <Text style={styles.rechargeLabel} numberOfLines={1}>
                + Recharge
              </Text>
            </Pressable>
          </GlassCard>

          {/* Filter */}
          <View style={styles.filters}>
            {FILTERS.map(f => {
              const selected = filter === f.id;
              const label = (
                <Text
                  style={[styles.filterLabel, selected && styles.filterLabelSelected]}
                  numberOfLines={1}
                >
                  {f.label}
                </Text>
              );
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={f.label}
                  style={styles.filterItem}
                >
                  {selected ? (
                    <View style={[styles.filter, styles.filterSelected]}>{label}</View>
                  ) : (
                    <GlassCard angle={104.50339944909791} style={styles.filter}>
                      {label}
                    </GlassCard>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Transactions by day */}
          {history.loading ? (
            <LoadingView />
          ) : history.error ? (
            <ErrorCard error={history.error} onRetry={history.reload} />
          ) : groups.length === 0 ? (
            <EmptyText>No transactions yet</EmptyText>
          ) : (
            groups.map(g => (
              <View key={g.key} style={styles.group}>
                <Text style={styles.groupTitle} numberOfLines={1}>
                  {g.label}
                </Text>
                <View style={styles.list}>
                  {g.transactions.map(t => (
                    <TransactionCard key={t.id} transaction={t} />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

function TransactionCard({ transaction: t }: { transaction: Transaction }) {
  const { Icon, tint, color, label } = TYPE_STYLE[t.type] ?? TYPE_STYLE.debit;
  return (
    <GlassCard angle={112.42386393564023} style={styles.card}>
      <View style={styles.cardLead}>
        <View style={[styles.cardIcon, { backgroundColor: tint }]}>
          <Icon width={20} height={20} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {t.title}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {t.meta}
          </Text>
        </View>
      </View>
      <View style={styles.cardAmount}>
        <Text style={[styles.amount, { color }]} numberOfLines={1}>
          {t.amountText}
        </Text>
        <Text style={styles.cardMeta}>{t.typeLabel || label}</Text>
      </View>
    </GlassCard>
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
  // Card paddings are the design value minus the 1px border
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 15,
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
  rechargeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 60,
    backgroundColor: colors.primary,
    boxShadow:
      '0px 8px 8px rgba(37, 35, 118, 0.32), inset 0px 2px 6px 0px rgba(240, 240, 255, 0.8)',
  },
  rechargeLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.black,
    includeFontPadding: false,
  },
  filters: {
    flexDirection: 'row',
    gap: 10,
  },
  filterItem: {
    flex: 1,
  },
  filter: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  filterSelected: {
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
  },
  filterLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: 'center',
    color: colors.white,
    includeFontPadding: false,
  },
  filterLabelSelected: {
    color: colors.black,
  },
  group: {
    gap: 16,
  },
  groupTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  cardLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  cardIcon: {
    padding: 10,
    borderRadius: 42,
  },
  cardText: {
    flexShrink: 1,
  },
  cardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  cardMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    includeFontPadding: false,
  },
  cardAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 20,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.85,
  },
});
