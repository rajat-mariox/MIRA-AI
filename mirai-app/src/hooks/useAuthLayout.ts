import { useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useKeyboardHeight from './useKeyboardHeight';
import { COSMIC_ART_RESERVED_HEIGHT } from '../components/CosmicArt';
import { DESIGN_WIDTH } from '../theme';

const MIN_ART_SCALE = 0.35;
const KEYBOARD_BOTTOM_GAP = 16;

/**
 * Layout for the login screens (cosmic art on top, form at the bottom). With the keyboard
 * open the art shrinks so the art, the text and the form all fit in the space above the
 * keyboard instead of being cut off; if even the smallest art doesn't fit, the form scrolls.
 * Put `onFormLayout` on the view wrapping everything below the art.
 */
export default function useAuthLayout(bottomPadding: number) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const [formHeight, setFormHeight] = useState(0);

  const artHeight = COSMIC_ART_RESERVED_HEIGHT * (width / DESIGN_WIDTH);
  const open = keyboard > 0;
  const paddingBottom = open ? KEYBOARD_BOTTOM_GAP : Math.max(bottomPadding, insets.bottom);
  const available = height - keyboard;
  const artScale =
    open && formHeight > 0
      ? Math.min(1, Math.max(MIN_ART_SCALE, (available - formHeight - paddingBottom) / artHeight))
      : 1;

  return {
    artScale,
    contentStyle: { minHeight: available, paddingTop: artHeight * artScale, paddingBottom },
    onFormLayout: (e: LayoutChangeEvent) => setFormHeight(e.nativeEvent.layout.height),
  };
}
