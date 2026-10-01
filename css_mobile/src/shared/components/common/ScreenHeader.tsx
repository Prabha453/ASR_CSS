import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from '@/shared/components/common/BackButton';
import { useTheme } from '@/shared/theme/ThemeContext';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, rightAction }: ScreenHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack ? <BackButton onPress={onBack} /> : null}
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
