import { Pressable, StyleSheet, View } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

export function TabBarButton({
  children,
  style,
  accessibilityState,
  ref: _ref,
  ...props
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected;

  return (
    <Pressable {...props} style={[styles.button, style]}>
      <View style={[styles.inner, focused && styles.innerActive]}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  innerActive: {
    backgroundColor: 'rgba(64, 81, 137, 0.08)',
  },
});
