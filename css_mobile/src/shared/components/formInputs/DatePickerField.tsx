import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';
import { useTheme } from '@/shared/theme/ThemeContext';

type DatePickerFieldProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
  containerStyle?: ViewStyle;
  onChange: (value: string) => void;
};

function parseIsoDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value?: string): string {
  const date = parseIsoDate(value);
  if (!date) return '';
  return date.toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DatePickerField({
  label,
  value,
  placeholder = 'Select date',
  error,
  required,
  disabled,
  maximumDate,
  minimumDate,
  containerStyle,
  onChange,
}: DatePickerFieldProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(parseIsoDate(value) ?? new Date());
  const display = formatDisplayDate(value);

  const openPicker = () => {
    if (disabled) return;
    setDraft(parseIsoDate(value) ?? new Date());
    setOpen(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, nextDate?: Date) => {
    setOpen(false);
    if (event.type === 'dismissed' || !nextDate) return;
    onChange(toIsoDate(nextDate));
  };

  const confirmIos = () => {
    onChange(toIsoDate(draft));
    setOpen(false);
  };

  const pickerValue = useMemo(() => draft, [draft]);

  return (
    <FormField label={label} error={error} required={required} containerStyle={containerStyle}>
      <Pressable
        disabled={disabled}
        onPress={openPicker}
        style={[
          formInputLayout.input,
          styles.input,
          {
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.card,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[styles.value, { color: display ? theme.colors.text : theme.colors.textMuted }]}
          numberOfLines={1}
        >
          {display || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{label || 'Select date'}</Text>
              <Pressable onPress={confirmIos}>
                <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="spinner"
              onChange={(_, nextDate) => {
                if (nextDate) setDraft(nextDate);
              }}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(33,37,41,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iosPicker: {
    alignSelf: 'center',
  },
});
