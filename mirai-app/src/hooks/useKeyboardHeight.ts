import { useEffect, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

// How much of the screen the keyboard covers (0 when hidden). Needed because Android
// apps are edge-to-edge, so the window no longer resizes for the keyboard.
export default function useKeyboardHeight(onShow?: () => void) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, e => {
      // On Android the reported height leaves out the navigation bar, so measure
      // from the keyboard's top edge to the bottom of the screen instead
      const covered =
        Platform.OS === 'android'
          ? Dimensions.get('screen').height - e.endCoordinates.screenY
          : e.endCoordinates.height;
      setHeight(Math.max(0, covered));
      onShow?.();
    });
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [onShow]);

  return height;
}
