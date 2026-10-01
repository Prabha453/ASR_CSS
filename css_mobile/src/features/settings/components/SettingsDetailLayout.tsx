import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { KeyboardAwareForm } from '@/shared/components/layout/KeyboardAwareForm';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsDetailLayoutProps = {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
  hero?: ReactNode;
  children: ReactNode;
};

export function SettingsDetailLayout({
  title,
  onBack,
  rightAction,
  hero,
  children,
}: SettingsDetailLayoutProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppHeader title={title} leftAction="back" onLeftPress={onBack} rightAction={rightAction} />
      {hero}
      <KeyboardAwareForm contentContainerStyle={styles.body}>{children}</KeyboardAwareForm>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    paddingHorizontal: designSystem.screenPadding,
    paddingTop: designSystem.cardGap,
    paddingBottom: designSystem.sectionGap * 2,
  },
});
