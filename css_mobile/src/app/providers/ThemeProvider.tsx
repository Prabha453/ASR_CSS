import { ReactNode } from 'react';
import { useAppSelector } from '@/app/store/hooks';
import { ThemeContext } from '@/shared/theme/ThemeContext';
import { createTheme } from '@/shared/theme';

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const scheme = useAppSelector((state) => state.theme.scheme);
  const theme = createTheme(scheme);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
}
