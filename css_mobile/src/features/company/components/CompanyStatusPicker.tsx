import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FormField } from '@/shared/components/formInputs';
import { formInputLayout } from '@/shared/components/formInputs/formInputStyles';
import { useTheme } from '@/shared/theme/ThemeContext';
import { COMPANY_STATUS_META } from '../constants/company.constants';

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING'] as const;

type CompanyStatusPickerProps = {
  value: string;
  onChange: (next: string) => void;
};

export function CompanyStatusPicker({ value, onChange }: CompanyStatusPickerProps) {
  const { theme } = useTheme();

  return (
    <FormField label="Status">
      <View style={styles.row}>
        {STATUS_OPTIONS.map((option) => {
          const meta = COMPANY_STATUS_META[option] ?? COMPANY_STATUS_META.ACTIVE;
          const active = value === option;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                formInputLayout.chip,
                {
                  backgroundColor: active ? meta.color : theme.colors.card,
                  borderColor: active ? meta.color : theme.colors.border,
                },
              ]}
            >
              <Text style={[formInputLayout.chipText, { color: active ? '#fff' : theme.colors.text }]}>
                {meta.label}
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
});
