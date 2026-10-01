import { TextStyle, ViewStyle } from 'react-native';
import { fontSize, fontWeight } from './typography';

export const designSystem = {
  headerHeight: 60,
  iconCircleSize: 44,
  iconCircleRadius: 12,
  cardRadius: 16,
  formRadius: 10,
  formHeight: 42,
  formFontSize: fontSize.body,
  formPaddingH: 12,
  formFieldGap: 12,
  formLabelSize: fontSize.label,
  formLabelGap: 5,
  formMultilineMinHeight: 72,
  formMultilinePadding: 8,
  screenPadding: 16,
  sectionGap: 24,
  cardGap: 12,
  listGap: 10,
  listRowMinHeight: 68,
} as const;

export const cardStyle: ViewStyle = {
  backgroundColor: '#ffffff',
  borderRadius: designSystem.cardRadius,
  padding: designSystem.screenPadding,
  marginBottom: designSystem.cardGap,
  shadowColor: '#212529',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

export const headerShadow: ViewStyle = {
  shadowColor: '#212529',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 4,
};

/**
 * Role-based text presets. Components should use these instead of raw font
 * sizes so typography stays consistent. All sizes come from the canonical
 * scale in typography.ts.
 */
export const textStyles = {
  screenTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: '#212529',
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.semibold,
    color: '#212529',
  } satisfies TextStyle,
  cardTitle: {
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.medium,
    color: '#212529',
  } satisfies TextStyle,
  body: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: '#212529',
  } satisfies TextStyle,
  label: {
    fontSize: fontSize.label,
    fontWeight: fontWeight.medium,
    color: '#212529',
  } satisfies TextStyle,
  description: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    color: '#878a99',
  } satisfies TextStyle,
  sectionLabel: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
    color: '#878a99',
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;
