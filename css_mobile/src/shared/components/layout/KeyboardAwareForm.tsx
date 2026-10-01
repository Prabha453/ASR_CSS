import { ReactNode, RefObject, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type KeyboardAwareFormProps = {
  children: ReactNode;
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Extra offset above keyboard (header / sticky chrome). */
  keyboardVerticalOffset?: number;
  scrollRef?: RefObject<ScrollView | null>;
} & Pick<ScrollViewProps, 'keyboardShouldPersistTaps' | 'showsVerticalScrollIndicator'>;

/**
 * Shared form shell that keeps focused inputs visible above the keyboard
 * on both iOS and Android.
 */
export function KeyboardAwareForm({
  children,
  footer,
  contentContainerStyle,
  style,
  keyboardVerticalOffset,
  scrollRef,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
}: KeyboardAwareFormProps) {
  const insets = useSafeAreaInsets();
  const localRef = useRef<ScrollView>(null);
  const ref = scrollRef ?? localRef;

  const offset =
    keyboardVerticalOffset ??
    (Platform.OS === 'ios' ? Math.max(insets.top, 8) + 56 : 0);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={offset}
    >
      <ScrollView
        ref={ref}
        style={styles.flex}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      >
        {children}
      </ScrollView>
      {footer ? <View>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
