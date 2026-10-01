import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';

export type BackButtonVariant = 'default' | 'onPrimary' | 'circle';

type BackButtonProps = {
  onPress: () => void;
  variant?: BackButtonVariant;
  color?: string;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function BackButton({
  onPress,
  variant = 'default',
  color,
  size = 22,
  style,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  const { theme } = useTheme();
  const iconColor =
    color ?? (variant === 'default' ? theme.colors.primary : '#fff');

  if (variant === 'circle') {
    return (
      <Pressable
        style={[styles.circle, style]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={size} color={iconColor} />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[variant === 'onPrimary' ? styles.onPrimary : styles.default, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <Ionicons name="arrow-back" size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  default: {
    padding: 4,
    marginRight: 4,
  },
  onPrimary: {
    padding: 4,
    marginBottom: 8,
  },
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
