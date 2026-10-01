import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { formInputLayout } from './formInputStyles';

type FormFieldProps = {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  children: ReactNode;
};

export function FormField({
  label,
  error,
  required,
  containerStyle,
  children,
}: FormFieldProps) {
  const { theme } = useTheme();

  return (
    <View style={[formInputLayout.field, containerStyle]}>
      {label ? (
        <Text style={[formInputLayout.label, { color: theme.colors.text }]}>
          {label}
          {required ? <Text style={{ color: theme.colors.danger }}> *</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? (
        <Text style={[formInputLayout.error, { color: theme.colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}
