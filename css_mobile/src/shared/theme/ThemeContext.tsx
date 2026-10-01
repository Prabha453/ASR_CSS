import { createContext, useContext } from 'react';
import { AppTheme, createTheme } from './index';

type ThemeContextValue = {
  theme: AppTheme;
};

export const ThemeContext = createContext<ThemeContextValue>({
  theme: createTheme('light'),
});

export const useTheme = () => useContext(ThemeContext);
