import { ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useTheme } from '@/shared/theme/ThemeContext';

type NavigationProviderProps = {
  children: ReactNode;
};

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { theme } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: theme.scheme === 'dark',
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.danger,
        },
        fonts: {
          regular: { fontFamily: theme.typography.fontFamily.regular, fontWeight: '400' },
          medium: { fontFamily: theme.typography.fontFamily.medium, fontWeight: '500' },
          bold: { fontFamily: theme.typography.fontFamily.bold, fontWeight: '700' },
          heavy: { fontFamily: theme.typography.fontFamily.bold, fontWeight: '700' },
        },
      }}
    >
      {children}
    </NavigationContainer>
  );
}
