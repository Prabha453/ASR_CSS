import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

export type PrimaryButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label?: string;
  children?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  textStyle?: TextStyle;
  round?: boolean;
  gradient?: readonly [string, string, ...string[]];
};

export function PrimaryButton({
  label,
  children,
  loading,
  loadingLabel,
  style,
  contentStyle,
  textStyle,
  round,
  gradient,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const isDisabled = Boolean(disabled || loading);
  const colors = gradient ?? theme.colors.primaryGradient;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      style={({ pressed }) => [
        round ? styles.roundWrapper : styles.wrapper,
        { opacity: isDisabled ? 0.7 : pressed ? 0.92 : 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[round ? styles.roundGradient : styles.gradient, contentStyle]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : children ? (
          children
        ) : (
          <Text style={[styles.text, textStyle]} numberOfLines={1}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: designSystem.formHeight,
    borderRadius: designSystem.formRadius,
    overflow: 'hidden',
  },
  roundWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#405189',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designSystem.formPaddingH,
  },
  roundGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: designSystem.formFontSize,
    fontWeight: '700',
  },
});
