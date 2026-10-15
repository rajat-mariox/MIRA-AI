import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';
import TabHome from '../assets/images/tab-home.svg';
import TabHoroscope from '../assets/images/tab-horoscope.svg';
import TabKundli from '../assets/images/tab-kundli.svg';
import TabPanchang from '../assets/images/tab-panchang.svg';
import TabQueReport from '../assets/images/tab-que-report.svg';
import { colors, fonts } from '../theme';

export type TabKey = 'home' | 'horoscope' | 'kundli' | 'panchang' | 'que-report';

type Tab = {
  key: TabKey;
  label: string;
  Icon: React.FC<SvgProps>;
  /** icon size; the Home and Horoscope artwork is drawn slightly smaller than the others */
  size: number;
};

// Que & Report (the chat) sits in the middle
const TABS: Tab[] = [
  { key: 'home', label: 'Home', Icon: TabHome, size: 23 },
  { key: 'horoscope', label: 'Horoscope', Icon: TabHoroscope, size: 23.5 },
  { key: 'que-report', label: 'Que & Report', Icon: TabQueReport, size: 26 },
  { key: 'kundli', label: 'Kundli', Icon: TabKundli, size: 26 },
  { key: 'panchang', label: 'Panchang', Icon: TabPanchang, size: 26 },
];

/** Black bar height above the bottom padding */
const BAR_HEIGHT = 58;
/** Active bubble */
const BUBBLE = 56;
/** How far the bubble rises above the bar's top edge */
const OVERHANG = 24;
/** Box the bubble is drawn in (a little larger than the bubble) */
const GLOW = BUBBLE + 24;
const BAR_PADDING_X = 8;

// Notch: half-width at the top edge and depth below it; the bubble's bottom is at
// BUBBLE - OVERHANG = 32 below the edge, so the notch keeps a ~6dp gap around it
const NOTCH_HALF = 48;
const NOTCH_DEPTH = 38;

/**
 * Height of the bar (including the raised bubble) above the safe-area padding,
 * so screens can pad their content: TAB_BAR_HEIGHT + Math.max(12, insets.bottom).
 */
export const TAB_BAR_HEIGHT = OVERHANG + BAR_HEIGHT;

type Props = {
  active: TabKey;
  onPress: (key: TabKey) => void;
};

/**
 * Bar background twice the screen width with the notch at x = width, so translating it by
 * (tabCenter - width) moves the notch under any tab while the bar still covers the screen.
 */
function barPath(width: number, height: number) {
  const c = width;
  const l = c - NOTCH_HALF;
  const r = c + NOTCH_HALF;
  return [
    'M0 0',
    `L${l} 0`,
    `C${c - 34} 0 ${c - 36} ${NOTCH_DEPTH} ${c} ${NOTCH_DEPTH}`,
    `C${c + 36} ${NOTCH_DEPTH} ${c + 34} 0 ${r} 0`,
    `L${width * 2} 0`,
    `L${width * 2} ${height}`,
    `L0 ${height}`,
    'Z',
  ].join(' ');
}

function TabItem({
  tab,
  isActive,
  iconOpacity,
  onPress,
}: {
  tab: Tab;
  isActive: boolean;
  iconOpacity: Animated.Value;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      {/* Same slot for every icon so all labels sit on one line; the active one is shown in the bubble */}
      <Animated.View style={[styles.iconSlot, { opacity: iconOpacity }]}>
        <tab.Icon width={tab.size} height={tab.size} color={colors.tabInactive} />
      </Animated.View>
      <Text
        style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

export default function BottomTabBar({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bottomPad = Math.max(12, insets.bottom);

  const activeIndex = Math.max(0, TABS.findIndex(t => t.key === active));
  const itemWidth = (width - BAR_PADDING_X * 2) / TABS.length;
  const centerOf = (i: number) => BAR_PADDING_X + itemWidth * (i + 0.5);

  // x = center of the active tab; drives both the notch and the bubble
  const x = useRef(new Animated.Value(centerOf(activeIndex))).current;
  const scale = useRef(new Animated.Value(1)).current;
  const iconOpacity = useRef(TABS.map((_, i) => new Animated.Value(i === activeIndex ? 0 : 1))).current;
  const lastIndex = useRef(activeIndex);
  const lastWidth = useRef(width);

  useEffect(() => {
    const target = BAR_PADDING_X + ((width - BAR_PADDING_X * 2) / TABS.length) * (activeIndex + 0.5);
    if (lastWidth.current !== width) {
      // rotation / resize: jump, no animation
      lastWidth.current = width;
      x.setValue(target);
    }
    if (lastIndex.current === activeIndex) return;
    lastIndex.current = activeIndex;

    Animated.parallel([
      Animated.spring(x, {
        toValue: target,
        useNativeDriver: true,
        damping: 18,
        stiffness: 180,
        mass: 0.9,
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.82, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 120 }),
      ]),
      ...iconOpacity.map((v, i) =>
        Animated.timing(v, { toValue: i === activeIndex ? 0 : 1, duration: 180, useNativeDriver: true }),
      ),
    ]).start();
  }, [activeIndex, width, x, scale, iconOpacity]);

  const bgHeight = BAR_HEIGHT + bottomPad;
  const bgTranslate = x.interpolate({ inputRange: [0, 1], outputRange: [-width, 1 - width] });
  const bubbleTranslate = x.interpolate({ inputRange: [0, 1], outputRange: [-GLOW / 2, 1 - GLOW / 2] });
  const activeTab = TABS[activeIndex];

  return (
    <View style={[styles.root, { height: OVERHANG + bgHeight }]} pointerEvents="box-none">
      {/* Black bar with the notch, slid under the active tab */}
      <Animated.View
        pointerEvents="none"
        style={[styles.background, { width: width * 2, height: bgHeight, transform: [{ translateX: bgTranslate }] }]}
      >
        <Svg width={width * 2} height={bgHeight}>
          <Path d={barPath(width, bgHeight)} fill={colors.black} />
        </Svg>
      </Animated.View>

      <View style={[styles.row, { height: bgHeight, paddingBottom: bottomPad }]}>
        {TABS.map((tab, i) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={i === activeIndex}
            iconOpacity={iconOpacity[i]}
            onPress={() => onPress(tab.key)}
          />
        ))}
      </View>

      {/* Raised bubble (always mounted; only transforms animate) */}
      <Animated.View
        style={[styles.bubbleWrap, { transform: [{ translateX: bubbleTranslate }, { scale }] }]}
        pointerEvents="box-none"
      >
        <Svg width={GLOW} height={GLOW} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx={GLOW / 2} cy={GLOW / 2} r={BUBBLE / 2} fill={colors.primary} />
        </Svg>
        <Pressable
          onPress={() => onPress(activeTab.key)}
          accessibilityRole="button"
          accessibilityLabel={activeTab.label}
          style={styles.bubble}
        >
          <activeTab.Icon width={activeTab.size} height={activeTab.size} color={colors.onPrimary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  background: {
    position: 'absolute',
    left: 0,
    top: OVERHANG,
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: OVERHANG,
    flexDirection: 'row',
    paddingHorizontal: BAR_PADDING_X,
  },
  item: {
    flex: 1,
    height: BAR_HEIGHT,
    paddingTop: 10,
    gap: 4,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  iconSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
  labelActive: {
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  labelInactive: {
    fontFamily: fonts.interMedium,
    color: colors.tabInactive,
  },
  // The glow box is centered on the bubble, which sits OVERHANG above the bar's top edge
  bubbleWrap: {
    position: 'absolute',
    left: 0,
    top: -(GLOW - BUBBLE) / 2,
    width: GLOW,
    height: GLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
