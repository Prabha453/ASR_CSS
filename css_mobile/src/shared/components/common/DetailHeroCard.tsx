import { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type DetailHeroCardProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  style?: ViewStyle;
};

export function DetailHeroCard({ title, subtitle, badge, meta, style }: DetailHeroCardProps) {
  const { theme } = useTheme();

  return (
    <LinearGradient colors={[...theme.colors.primaryGradient]} style={[styles.card, style]}>
      <View style={styles.topRow}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge}
      </View>
      {meta}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
});
