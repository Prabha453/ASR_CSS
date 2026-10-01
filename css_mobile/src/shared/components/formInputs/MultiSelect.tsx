import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';

export type MultiSelectProps = {
  label?: string;
  options: { label: string; value: string }[];
  values: string[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

export function MultiSelect({
  label,
  options,
  values,
  error,
  required,
  disabled,
  onChange,
}: MultiSelectProps) {
  const { theme } = useTheme();

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  return (
    <FormField label={label} error={error} required={required}>
      <View style={styles.wrap}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              style={[
                formInputLayout.chip,
                {
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? `${theme.colors.primary}15` : theme.colors.card,
                },
              ]}
              onPress={() => toggleValue(option.value)}
            >
              <Text
                style={[
                  formInputLayout.chipText,
                  { color: selected ? theme.colors.primary : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
