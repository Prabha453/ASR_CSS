import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useTheme } from '@/shared/theme/ThemeContext';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.danger }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
      {onRetry ? (
        <PrimaryButton label="Try Again" onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
