import { useState } from 'react';
import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';

export type TextInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
};

export function TextInput({
  label,
  error,
  required,
  containerStyle,
  style,
  editable = true,
  multiline,
  onFocus,
  onBlur,
  ...props
}: TextInputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <FormField
      label={label}
      error={error}
      required={required}
      containerStyle={containerStyle}
    >
      <RNTextInput
        style={[
          formInputLayout.input,
          multiline && formInputLayout.multiline,
          {
            borderColor,
            backgroundColor: theme.colors.card,
            color: theme.colors.text,
          },
          !editable && formInputLayout.disabled,
          style,
        ]}
        placeholderTextColor={theme.colors.textMuted}
        editable={editable}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        multiline={multiline}
        {...props}
      />
    </FormField>
  );
}
