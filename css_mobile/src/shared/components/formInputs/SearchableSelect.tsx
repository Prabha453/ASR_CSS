import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { formInputLayout } from './formInputStyles';
import { SelectOption } from './CustomSelect';

export type SearchableSelectProps = {
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

export function SearchableSelect({
  label,
  placeholder = 'Select an option',
  value,
  options,
  error,
  required,
  disabled,
  containerStyle,
  onChange,
}: SearchableSelectProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term),
    );
  }, [options, query]);

  const borderColor = error ? theme.colors.danger : theme.colors.border;

  const handleSelect = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <FormField label={label} error={error} required={required} containerStyle={containerStyle}>
        <Pressable
          disabled={disabled}
          onPress={() => setOpen(true)}
          style={[
            styles.trigger,
            formInputLayout.input,
            {
              borderColor,
              backgroundColor: theme.colors.card,
            },
            disabled && formInputLayout.disabled,
          ]}
        >
          <Text
            style={[
              styles.triggerText,
              { color: selected ? theme.colors.text : theme.colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </FormField>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={styles.backdropPress} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>
              {label ?? 'Select'}
            </Text>

            <View style={[styles.searchWrap, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
              <Ionicons name="search" size={18} color={theme.colors.textMuted} />
              <RNTextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search..."
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.searchInput, { color: theme.colors.text }]}
                autoFocus
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: theme.colors.textMuted }]}>No matches found</Text>
              }
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => handleSelect(item.value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: active ? `${theme.colors.primary}12` : 'transparent',
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: active ? theme.colors.primary : theme.colors.text },
                        active && styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    maxHeight: '72%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d9dce3',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  list: {
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextActive: {
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
});
