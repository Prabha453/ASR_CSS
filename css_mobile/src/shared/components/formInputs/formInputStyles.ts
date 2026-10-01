import { Platform, StyleSheet } from 'react-native';
import type { AppTheme } from '@/shared/theme';
import { designSystem } from '@/shared/theme/designSystem';

/** Single source of truth for compact form controls across the app. */
export const formInputLayout = StyleSheet.create({
  field: {
    marginBottom: designSystem.formFieldGap,
  },
  label: {
    fontSize: designSystem.formLabelSize,
    fontWeight: '500',
    marginBottom: designSystem.formLabelGap,
  },
  input: {
    borderWidth: 1,
    borderRadius: designSystem.formRadius,
    minHeight: designSystem.formHeight,
    paddingHorizontal: designSystem.formPaddingH,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: designSystem.formFontSize,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  multiline: {
    height: undefined,
    minHeight: designSystem.formMultilineMinHeight,
    paddingVertical: designSystem.formMultilinePadding,
    textAlignVertical: 'top',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    marginTop: 4,
    fontSize: 11,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: designSystem.formPaddingH,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: designSystem.formLabelSize,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: designSystem.formLabelSize,
    fontWeight: '700',
    marginBottom: designSystem.formLabelGap,
  },
});

type FormInputStyles = {
  container: object;
  label: object;
  required: object;
  input: object;
  inputError: object;
  error: object;
  disabled: object;
};

export const createFormInputStyles = (theme: AppTheme): FormInputStyles =>
  StyleSheet.create({
    container: {
      marginBottom: designSystem.formFieldGap,
    },
    label: {
      fontSize: designSystem.formLabelSize,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: designSystem.formLabelGap,
    },
    required: {
      color: theme.colors.danger,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: designSystem.formRadius,
      backgroundColor: theme.colors.card,
      paddingHorizontal: designSystem.formPaddingH,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      minHeight: designSystem.formHeight,
      fontSize: designSystem.formFontSize,
      lineHeight: 20,
      color: theme.colors.text,
      includeFontPadding: false,
      textAlignVertical: 'center' as const,
    },
    inputError: {
      borderColor: theme.colors.danger,
    },
    error: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.fontSize.caption,
      color: theme.colors.danger,
    },
    disabled: {
      opacity: 0.6,
    },
  });
