import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

/**
 * How rows look at a distance of 0, 1, 2, ... rows from the selected one.
 * Values come from the Figma pickers, which fake an iOS-style 3D wheel.
 */
export type WheelProfile = {
  offsets: number[];
  scaleX: number[];
  scaleY: number[];
  opacity: number[];
};

type Props = {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  profile: WheelProfile;
  /** visible height; the selected row is centered */
  height: number;
  /** scroll distance between two rows */
  rowHeight: number;
  textStyle: StyleProp<TextStyle>;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** wrap around like the iOS picker (months, hours, minutes) */
  loop?: boolean;
};

// A looping wheel repeats its items this many times and quietly jumps back to the
// middle copy whenever the user gets close to either end
const LOOP_CYCLES = 5;
const LOOP_MIDDLE = Math.floor(LOOP_CYCLES / 2);

// Only rows this close to the centre are mounted; the window moves while scrolling.
// Mounting every row (300 for a looping minute wheel) made screens slow to open.
const WINDOW = 14;
const SHIFT_EVERY = 5;

export default function WheelPicker({
  items,
  selectedIndex,
  onChange,
  profile,
  height,
  rowHeight,
  textStyle,
  align = 'center',
  style,
  accessibilityLabel,
  loop = false,
}: Props) {
  const count = items.length;
  const rowCount = loop ? count * LOOP_CYCLES : count;
  const toRow = (index: number) => (loop ? LOOP_MIDDLE * count + index : index);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollY = useRef(new Animated.Value(toRow(selectedIndex) * rowHeight)).current;
  const lastReported = useRef(selectedIndex);
  const currentRow = useRef(toRow(selectedIndex));
  const [windowCenter, setWindowCenter] = useState(currentRow.current);
  const windowCenterRef = useRef(windowCenter);

  const moveWindow = useCallback((row: number) => {
    windowCenterRef.current = row;
    setWindowCenter(row);
  }, []);

  // Keep the wheel in sync when the parent changes or clamps the selection
  useEffect(() => {
    if (lastReported.current !== selectedIndex) {
      lastReported.current = selectedIndex;
      // Stay in the current copy of a looping wheel so it does not spin far
      const row = loop
        ? currentRow.current - (currentRow.current % count) + selectedIndex
        : selectedIndex;
      currentRow.current = row;
      moveWindow(row);
      scrollRef.current?.scrollTo({ y: row * rowHeight, animated: true });
    }
  }, [selectedIndex, rowHeight, loop, count, moveWindow]);

  const settle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      let row = Math.max(
        0,
        Math.min(rowCount - 1, Math.round(e.nativeEvent.contentOffset.y / rowHeight)),
      );
      const index = loop ? row % count : row;
      if (loop && (row < count || row >= count * (LOOP_CYCLES - 1))) {
        row = LOOP_MIDDLE * count + index;
        scrollRef.current?.scrollTo({ y: row * rowHeight, animated: false });
      }
      currentRow.current = row;
      moveWindow(row);
      if (index !== lastReported.current) {
        lastReported.current = index;
        onChange(index);
      }
    },
    [rowCount, count, loop, onChange, rowHeight, moveWindow],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const row = Math.round(e.nativeEvent.contentOffset.y / rowHeight);
          if (Math.abs(row - windowCenterRef.current) >= SHIFT_EVERY) moveWindow(row);
        },
      }),
    [scrollY, rowHeight, moveWindow],
  );

  const padding = (height - rowHeight) / 2;
  const first = Math.max(0, windowCenter - WINDOW);
  const last = Math.min(rowCount - 1, windowCenter + WINDOW);
  const alignItems = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';

  const visibleRows = [];
  for (let i = first; i <= last; i++) {
    visibleRows.push(
      <WheelRow
        key={i}
        row={i}
        label={items[i % count]}
        top={padding + i * rowHeight}
        rowHeight={rowHeight}
        scrollY={scrollY}
        profile={profile}
        alignItems={alignItems}
        textStyle={textStyle}
      />,
    );
  }

  return (
    <View
      style={[{ height }, styles.clip, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: items[selectedIndex] }}
    >
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={rowHeight}
        decelerationRate="fast"
        nestedScrollEnabled
        contentOffset={{ x: 0, y: currentRow.current * rowHeight }}
        onLayout={() => scrollRef.current?.scrollTo({ y: currentRow.current * rowHeight, animated: false })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={e => {
          if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) settle(e);
        }}
      >
        <View style={{ height: rowCount * rowHeight + padding * 2 }}>{visibleRows}</View>
      </Animated.ScrollView>
    </View>
  );
}

type RowProps = {
  row: number;
  label: string;
  top: number;
  rowHeight: number;
  scrollY: Animated.Value;
  profile: WheelProfile;
  alignItems: 'flex-start' | 'flex-end' | 'center';
  textStyle: StyleProp<TextStyle>;
};

// One row; its position, size and fade follow the scroll offset on the native thread
const WheelRow = memo(function WheelRowImpl({
  row,
  label,
  top,
  rowHeight,
  scrollY,
  profile,
  alignItems,
  textStyle,
}: RowProps) {
  const animated = useMemo(() => {
    const depth = profile.offsets.length - 1;
    // scrollY at which this row is k rows below the centre, for k = depth … -depth
    const inputRange: number[] = [];
    const translateY: number[] = [];
    const scaleX: number[] = [];
    const scaleY: number[] = [];
    const opacity: number[] = [];
    for (let k = depth; k >= -depth; k--) {
      const d = Math.abs(k);
      inputRange.push((row - k) * rowHeight);
      translateY.push(Math.sign(k) * profile.offsets[d] - k * rowHeight);
      scaleX.push(profile.scaleX[d]);
      scaleY.push(profile.scaleY[d]);
      opacity.push(profile.opacity[d]);
    }
    const interpolate = (outputRange: number[]) =>
      scrollY.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
    return {
      opacity: interpolate(opacity),
      transform: [
        { translateY: interpolate(translateY) },
        { scaleX: interpolate(scaleX) },
        { scaleY: interpolate(scaleY) },
      ],
    };
  }, [row, rowHeight, scrollY, profile]);

  return (
    <Animated.View style={[styles.row, { top, height: rowHeight, alignItems }, animated]}>
      <Animated.Text style={textStyle} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    overflow: 'visible',
  },
});
