import React, { useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import GlassCard from '../GlassCard';
import ScoreBar from '../ScoreBar';
import ExpandableText from '../ExpandableText';
import ChevronDown from '../../assets/images/profile-chevron-down.svg';
import type { HoroscopeData } from '../../api/horoscope';
import { percentOf } from '../../utils/astro';
import { colors, fonts } from '../../theme';

type Forecast = { id: string; title: string; text: string; percent?: number };

// Category key in prediction / horoscope_percentage -> card title, in display order
const FORECAST_CATEGORIES: { key: keyof HoroscopeData['prediction']; title: string }[] = [
  { key: 'personal', title: 'GENERAL FORECAST' },
  { key: 'health', title: 'HEALTH FORECAST' },
  { key: 'emotions', title: 'LOVE FORECAST' },
  { key: 'profession', title: 'CAREER FORECAST' },
  { key: 'travel', title: 'TRAVEL FORECAST' },
  { key: 'luck', title: 'LUCK FORECAST' },
];

function predictionText(raw: unknown): string {
  if (Array.isArray(raw)) return raw.filter(x => typeof x === 'string').join(' • ').trim();
  return typeof raw === 'string' ? raw.trim() : '';
}

/** One card per category that has prediction text */
export function buildForecasts(h: HoroscopeData): Forecast[] {
  const out: Forecast[] = [];
  for (const c of FORECAST_CATEGORIES) {
    const text = predictionText(h.prediction?.[c.key]);
    if (text) out.push({ id: c.key, title: c.title, text, percent: percentOf(h, c.key) });
  }
  return out;
}

const GAP = 10;
const LINE = 19;

type Props = {
  horoscope: HoroscopeData;
  /** Tapping a card runs this; without it the card unfolds in place */
  onPressCard?: () => void;
  /** Home: cards start with three lines of text and the chevron hides / shows the text */
  collapsible?: boolean;
};

/**
 * Horizontally sliding forecast cards (~85% of the screen wide so the next one peeks in):
 * title + chevron, three lines of the prediction and the category's score bar.
 * Bleeds to the screen edges; place it inside the page's 20dp horizontal padding.
 */
export default function ForecastCarousel({ horoscope, onPressCard, collapsible }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.round(width * 0.85);
  const forecasts = buildForecasts(horoscope);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {forecasts.map(f => (
        <ForecastCard key={f.id} {...f} width={cardWidth} onPress={onPressCard} collapsible={collapsible} />
      ))}
    </ScrollView>
  );
}

/** True when the horoscope has at least one card to show */
export function hasForecasts(h: HoroscopeData | undefined): h is HoroscopeData {
  return !!h && buildForecasts(h).length > 0;
}

function ForecastCard({
  title,
  text,
  percent,
  width,
  onPress,
  collapsible,
}: Forecast & { width: number; onPress?: () => void; collapsible?: boolean }) {
  const [open, setOpen] = useState(false);
  // collapsible: the text shows until the chevron hides it
  const [hidden, setHidden] = useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (collapsible) setHidden(v => !v);
    else setOpen(v => !v);
  };
  // Chevron points up while the text can be folded away
  const chevronUp = collapsible ? !hidden : open;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={onPress ? undefined : { expanded: collapsible ? !hidden : open }}
      accessibilityLabel={`${title}. ${text}`}
    >
      <GlassCard angle={98.28} style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <ChevronDown width={20} height={20} style={[styles.chevron, chevronUp && styles.chevronOpen]} />
        </View>
        {collapsible && hidden ? null : open ? (
          <ExpandableText style={styles.textOpen} lines={8}>
            {text}
          </ExpandableText>
        ) : (
          <Text style={styles.text} numberOfLines={3}>
            {text}
          </Text>
        )}
        <ScoreBar percent={percent ?? 0} width={132} />
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroller: {
    marginHorizontal: -20,
  },
  // Cards keep the 20dp page inset; an unfolded card grows without stretching the others
  row: {
    paddingHorizontal: 20,
    gap: GAP,
    alignItems: 'flex-start',
  },
  pressed: {
    opacity: 0.85,
  },
  // Card paddings are the design value minus the 1px border
  card: {
    padding: 15,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.5,
    color: colors.white,
    includeFontPadding: false,
  },
  chevron: {
    opacity: 0.8,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  // Always three lines tall so all cards in the row line up
  text: {
    height: LINE * 3,
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: LINE,
    color: 'rgba(255, 255, 255, 0.8)',
    includeFontPadding: false,
  },
  textOpen: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: LINE,
    color: 'rgba(255, 255, 255, 0.8)',
    includeFontPadding: false,
  },
});
