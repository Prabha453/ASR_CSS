import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { SelectOption } from './CustomSelect';

type OptionPickerProps = {
  label?: string;
  value?: string;
  options: SelectOption[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  onChange: (value: string) => void;
};

export function OptionPicker({
  label,
  value,
  options,
  error,
  required,
  disabled,
  containerStyle,
  onChange,
}: OptionPickerProps) {
  const { theme } = useTheme();

  return (
    <FormField label={label} error={error} required={required} containerStyle={containerStyle}>
      <View style={[styles.track, { backgroundColor: theme.colors.background }]}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                active && {
                  backgroundColor: theme.colors.card,
                  shadowColor: '#212529',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: active ? theme.colors.primary : theme.colors.textMuted },
                  active && styles.optionTextActive,
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
  track: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  optionTextActive: {
    fontWeight: '700',
  },
});
