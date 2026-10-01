import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsGroupSectionProps = {
  title: string;
  children: ReactNode;
};

export function SettingsGroupSection({ title, children }: SettingsGroupSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[textStyles.sectionLabel, styles.title, { color: theme.colors.textMuted }]}>
        {title}
      </Text>
      <EnterpriseCard>{children}</EnterpriseCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: designSystem.sectionGap,
  },
  title: {
    marginBottom: 10,
    marginLeft: 2,
  },
});
