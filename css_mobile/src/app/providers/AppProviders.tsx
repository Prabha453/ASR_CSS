import { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/shared/components/common/ToastProvider';
import { ReduxProvider } from './ReduxProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from './ThemeProvider';
import { NavigationProvider } from './NavigationProvider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <ReduxProvider>
        <QueryProvider>
          <ThemeProvider>
            <ToastProvider>
              <NavigationProvider>{children}</NavigationProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
