import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type ScreenShellProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  header?: ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export function ScreenShell({
  children,
  scrollable = true,
  style,
  contentStyle,
  header,
  edges = ['bottom', 'left', 'right'],
}: ScreenShellProps) {
  const { theme } = useTheme();

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      {header}
      <SafeAreaView style={styles.flex} edges={header ? edges : undefined}>
        {body}
      </SafeAreaView>
    </View>
  );
}

export { AppHeader };

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: designSystem.screenPadding,
    paddingBottom: designSystem.sectionGap,
  },
});
