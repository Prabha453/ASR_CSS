import { useState } from 'react';
import {
  Pressable,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';

export type PasswordInputProps = RNTextInputProps & {
  label?: string;
  error?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
};

export function PasswordInput({
  label,
  error,
  required,
  containerStyle,
  style,
  editable = true,
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <FormField label={label} error={error} required={required} containerStyle={containerStyle}>
      <View>
        <RNTextInput
          style={[
            formInputLayout.input,
            styles.input,
            {
              borderColor,
              backgroundColor: theme.colors.card,
              color: theme.colors.text,
            },
            !editable && formInputLayout.disabled,
            style,
          ]}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry={!visible}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        <Pressable
          style={styles.toggle}
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  input: {
    paddingRight: 44,
  },
  toggle: {
    position: 'absolute',
    right: designSystem.formPaddingH,
    top: (designSystem.formHeight - 20) / 2,
  },
});
