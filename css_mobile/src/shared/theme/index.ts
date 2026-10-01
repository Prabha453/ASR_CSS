import { colors, ColorScheme, ThemeColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';
import { iconTokens, actionIconColors } from './iconTokens';
import { designSystem, textStyles, cardStyle, headerShadow } from './designSystem';

export type AppTheme = {
  colors: ThemeColors;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
  iconTokens: typeof iconTokens;
  actionIconColors: typeof actionIconColors;
  designSystem: typeof designSystem;
  textStyles: typeof textStyles;
  scheme: ColorScheme;
};

export const createTheme = (scheme: ColorScheme = 'light'): AppTheme => ({
  colors: colors[scheme],
  spacing,
  typography,
  shadows,
  iconTokens,
  actionIconColors,
  designSystem,
  textStyles,
  scheme,
});

export { colors, spacing, typography, shadows, iconTokens, actionIconColors, designSystem, textStyles, cardStyle, headerShadow };
export type { ColorScheme, ThemeColors };
