import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';

type EnterpriseCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function EnterpriseCard({ children, style, padded = false }: EnterpriseCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          marginBottom: designSystem.cardGap,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: designSystem.cardRadius,
    overflow: 'hidden',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  padded: {
    padding: designSystem.screenPadding,
  },
});
