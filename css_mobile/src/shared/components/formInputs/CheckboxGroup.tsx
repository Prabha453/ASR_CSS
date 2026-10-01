import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { formInputLayout } from './formInputStyles';
import { FormField } from './FormField';

export type CheckboxGroupProps = {
  label?: string;
  options: { label: string; value: string }[];
  values: string[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (values: string[]) => void;
};

export function CheckboxGroup(props: MultiSelectLikeProps) {
  return <MultiSelectLike {...props} />;
}

export type RadioGroupProps = {
  label?: string;
  options: { label: string; value: string }[];
  value?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
};

type MultiSelectLikeProps = CheckboxGroupProps;

function MultiSelectLike({
  label,
  options,
  values,
  error,
  required,
  disabled,
  onChange,
}: MultiSelectLikeProps) {
  const { theme } = useTheme();

  return (
    <FormField label={label} error={error} required={required}>
      <View style={styles.list}>
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              style={styles.row}
              onPress={() => {
                if (checked) {
                  onChange(values.filter((item) => item !== option.value));
                } else {
                  onChange([...values, option.value]);
                }
              }}
            >
              <View
                style={[
                  styles.box,
                  {
                    borderColor: checked ? theme.colors.primary : theme.colors.border,
                    backgroundColor: checked ? theme.colors.primary : theme.colors.card,
                  },
                ]}
              />
              <Text style={[formInputLayout.chipText, { fontWeight: '400', color: theme.colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

export function RadioGroup({
  label,
  options,
  value,
  error,
  required,
  disabled,
  onChange,
}: RadioGroupProps) {
  const { theme } = useTheme();

  return (
    <FormField label={label} error={error} required={required}>
      <View style={styles.list}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              style={styles.row}
              onPress={() => onChange(option.value)}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: selected ? theme.colors.primary : theme.colors.border },
                ]}
              >
                {selected ? (
                  <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />
                ) : null}
              </View>
              <Text style={[formInputLayout.chipText, { fontWeight: '400', color: theme.colors.text }]}>
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
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
});
