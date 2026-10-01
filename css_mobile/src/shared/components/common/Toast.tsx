import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
};

export function Toast({ message, type = 'info' }: ToastProps) {
  const { theme } = useTheme();
  const backgroundColor =
    type === 'success'
      ? theme.colors.success
      : type === 'error'
        ? theme.colors.danger
        : theme.colors.primary;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
