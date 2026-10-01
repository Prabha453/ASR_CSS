import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';

export type SelectOption = { label: string; value: string };

export type CustomSelectProps = {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  onChange: (value: string) => void;
};

export function CustomSelect({
  label,
  placeholder = 'Select an option',
  value,
  options,
  error,
  required,
  disabled,
  containerStyle,
  onChange,
}: CustomSelectProps) {
  const { theme } = useTheme();
  const selected = options.find((option) => option.value === value);

  return (
    <FormField label={label} error={error} required={required} containerStyle={containerStyle}>
      <View style={styles.options}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              style={[
                formInputLayout.chip,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.card,
                },
                disabled && formInputLayout.disabled,
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text
                style={[
                  formInputLayout.chipText,
                  { color: active ? theme.colors.primary : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!selected && placeholder ? (
        <Text style={[formInputLayout.error, { color: theme.colors.textMuted, marginTop: 4 }]}>
          {placeholder}
        </Text>
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
