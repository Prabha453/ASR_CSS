export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  primary: 'Poppins_400Regular',
  secondary: 'Poppins_400Regular',
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/**
 * Canonical type scale — every font size in the app should come from here.
 * Values are in design points (dp). Keep this as the single source of truth;
 * do not introduce new raw numbers in components.
 */
export const fontSize = {
  caption: 11,
  label: 12,
  small: 13,
  body: 14,
  bodyLg: 15,
  title: 16,
  lg: 18,
  xl: 20,
  display: 24,
  hero: 28,
} as const;

export const lineHeight = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

export const typography = {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
} as const;
