import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useTheme } from '@/shared/theme/ThemeContext';
import { MasterFieldConfig, MasterRecord } from '../types/settings.types';
import { SettingsField } from './SettingsField';

type MasterDataFormModalProps = {
  visible: boolean;
  title: string;
  fields: MasterFieldConfig[];
  initialValues?: MasterRecord;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: MasterRecord) => void;
};

export function MasterDataFormModal({
  visible,
  title,
  fields,
  initialValues,
  loading,
  onClose,
  onSubmit,
}: MasterDataFormModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<MasterRecord>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    const next: MasterRecord = {};
    fields.forEach((field) => {
      const current = initialValues?.[field.key];
      next[field.key] = current === undefined || current === null ? '' : String(current);
    });
    setValues(next);
    setErrors({});
  }, [fields, initialValues, visible]);

  const handleSubmit = () => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !String(values[field.key] ?? '').trim()) {
        nextErrors[field.key] = `${field.label} is required`;
      }
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload: MasterRecord = {};
    fields.forEach((field) => {
      const raw = values[field.key];
      if (field.type === 'number') {
        payload[field.key] = raw === '' ? null : Number(raw);
      } else {
        payload[field.key] = raw === '' ? null : raw;
      }
    });
    onSubmit(payload);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {fields.map((field) => (
              <SettingsField
                key={field.key}
                label={field.label}
                required={field.required}
                error={errors[field.key]}
                value={String(values[field.key] ?? '')}
                onChangeText={(value) => {
                  setValues((current) => ({ ...current, [field.key]: value }));
                  setErrors((current) => {
                    if (!current[field.key]) return current;
                    const next = { ...current };
                    delete next[field.key];
                    return next;
                  });
                }}
                placeholder={field.placeholder}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              />
            ))}
          </ScrollView>

          <PrimaryButton label="Save" loading={loading} onPress={handleSubmit} disabled={loading} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdropPress: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    paddingBottom: 12,
  },
});
