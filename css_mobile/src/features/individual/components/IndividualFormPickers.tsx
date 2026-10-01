import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField } from '@/shared/components/formInputs';
import { formInputLayout } from '@/shared/components/formInputs/formInputStyles';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  INDIVIDUAL_RISK_META,
  INDIVIDUAL_RISK_OPTIONS,
  INDIVIDUAL_STATUS_META,
  INDIVIDUAL_STATUS_OPTIONS,
} from '../constants/individual.constants';

type ChipPickerProps = {
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  colors?: Record<string, { label: string; color: string; bg?: string }>;
  onChange: (value: string) => void;
  required?: boolean;
};

function ChipPicker({ label, value, options, colors, onChange, required }: ChipPickerProps) {
  const { theme } = useTheme();

  return (
    <FormField label={label} required={required}>
      <View style={styles.row}>
        {options.map((option) => {
          const meta = colors?.[option.value];
          const active = value === option.value;
          const accent = meta?.color ?? theme.colors.primary;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                formInputLayout.chip,
                {
                  backgroundColor: active ? accent : theme.colors.card,
                  borderColor: active ? accent : theme.colors.border,
                },
              ]}
            >
              <Text style={[formInputLayout.chipText, { color: active ? '#fff' : theme.colors.text }]}>
                {meta?.label ?? option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

type IndividualStatusPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IndividualStatusPicker({ value, onChange }: IndividualStatusPickerProps) {
  return (
    <ChipPicker
      label="Status"
      value={value}
      options={INDIVIDUAL_STATUS_OPTIONS}
      colors={INDIVIDUAL_STATUS_META}
      onChange={onChange}
      required
    />
  );
}

type IndividualRiskPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IndividualRiskPicker({ value, onChange }: IndividualRiskPickerProps) {
  return (
    <ChipPicker
      label="Risk Rating"
      value={value}
      options={INDIVIDUAL_RISK_OPTIONS}
      colors={INDIVIDUAL_RISK_META}
      onChange={onChange}
    />
  );
}

type IndividualGenderPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function IndividualGenderPicker({ value, onChange }: IndividualGenderPickerProps) {
  const { theme } = useTheme();
  const options = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Other', value: 'OTHER' },
  ] as const;

  return (
    <FormField label="Gender">
      <View style={styles.genderRow}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.genderOption,
                {
                  backgroundColor: active ? `${theme.colors.primary}12` : theme.colors.card,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View
                style={[
                  styles.radioOuter,
                  { borderColor: active ? theme.colors.primary : theme.colors.border },
                ]}
              >
                {active ? (
                  <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.genderLabel,
                  {
                    color: active ? theme.colors.primary : theme.colors.text,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderOption: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  radioOuter: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  genderLabel: {
    fontSize: 11,
  },
});
