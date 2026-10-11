import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** iOS only: distance between the top of the screen and this view (e.g. a stack header). */
  iosOffset?: number;
};

/**
 * Lifts its content above the keyboard on every phone.
 *
 * Android does not resize the window for the keyboard here, and the keyboard's reported
 * `screenY` is in screen coordinates (it includes the status bar) while `measureInWindow` is
 * in window coordinates — comparing the two, as `KeyboardAvoidingView` does, is off by the
 * status bar height and by a different amount on every phone. Instead this uses only the
 * keyboard's *height*, and subtracts how far this view's bottom edge already sits above the
 * bottom of the window (a bottom tab bar, a safe-area wrapper). Both numbers are in the same
 * units on the same axis, so it holds regardless of status bar, notch or navigation style.
 *
 * iOS keeps the stock behaviour, which works there.
 */
export function KeyboardSafeView({ style, children, iosOffset = 0 }: Props) {
  const ref = useRef<View>(null);
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      ref.current?.measureInWindow((_x, y, _width, height) => {
        const gapBelowView = Math.max(0, Dimensions.get('window').height - (y + height));
        setPadding(Math.max(0, event.endCoordinates.height - gapBelowView));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setPadding(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={iosOffset} style={style}>
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View ref={ref} collapsable={false} style={[style, { paddingBottom: padding }]}>
      {children}
    </View>
  );
}
