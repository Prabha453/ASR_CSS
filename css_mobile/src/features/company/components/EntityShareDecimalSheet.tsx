import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useToast } from '@/shared/components/common/ToastProvider';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { entityShareService } from '../services/entityShare.service';
import { EntityShareDecimalSettings } from '../types/entityShare.types';

type DecimalDraft = {
  shares: string;
  paid: string;
  issued: string;
};

type EntityShareDecimalSheetProps = {
  visible: boolean;
  entityId: number;
  globalDecimals: { shares: number; paid: number; issued: number };
  entityDecimals?: EntityShareDecimalSettings | null;
  onClose: () => void;
};

const OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export function EntityShareDecimalSheet({
  visible,
  entityId,
  globalDecimals,
  entityDecimals,
  onClose,
}: EntityShareDecimalSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DecimalDraft>({ shares: '', paid: '', issued: '' });

  useEffect(() => {
    if (!visible) return;
    setDraft({
      shares:
        entityDecimals?.no_of_share_decimal_place != null
          ? String(entityDecimals.no_of_share_decimal_place)
          : '',
      paid:
        entityDecimals?.paid_up_share_decimal_place != null
          ? String(entityDecimals.paid_up_share_decimal_place)
          : '',
      issued:
        entityDecimals?.issued_share_decimal_place != null
          ? String(entityDecimals.issued_share_decimal_place)
          : '',
    });
  }, [visible, entityDecimals]);

  const saveMutation = useMutation({
    mutationFn: () =>
      entityShareService.upsertDecimalSettings(entityId, {
        no_of_share_decimal_place: draft.shares === '' ? null : Number(draft.shares),
        paid_up_share_decimal_place: draft.paid === '' ? null : Number(draft.paid),
        issued_share_decimal_place: draft.issued === '' ? null : Number(draft.issued),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['entity-share-decimals', entityId] });
      showToast('Decimal settings saved.', { type: 'success' });
      onClose();
    },
    onError: (error: Error) => showToast(error.message, { type: 'error' }),
  });

  const fields: { key: keyof DecimalDraft; label: string; global: number }[] = [
    { key: 'shares', label: 'No. of Shares', global: globalDecimals.shares },
    { key: 'paid', label: 'Paid-up Capital', global: globalDecimals.paid },
    { key: 'issued', label: 'Issued Capital', global: globalDecimals.issued },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.card,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => setDraft({ shares: '', paid: '', issued: '' })}
              hitSlop={8}
              style={styles.headerSide}
            >
              <Text style={[styles.reset, { color: theme.colors.danger }]}>Reset</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>Decimal Places</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.headerSide, styles.headerRight]}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[textStyles.description, styles.hint, { color: theme.colors.textMuted }]}>
            Override decimals for this entity only. Leave as Default to use firm-wide settings.
          </Text>

          <View style={[styles.globalNote, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="settings-outline" size={16} color={theme.colors.primary} />
            <Text style={[textStyles.description, { color: theme.colors.textMuted, flex: 1 }]}>
              Global defaults — Shares: {globalDecimals.shares} dp, Paid-up: {globalDecimals.paid} dp,
              Issued: {globalDecimals.issued} dp
            </Text>
          </View>

          {fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={[textStyles.label, { color: theme.colors.text }]}>{field.label}</Text>
              <View style={styles.options}>
                <Pressable
                  onPress={() => setDraft((current) => ({ ...current, [field.key]: '' }))}
                  style={[
                    styles.option,
                    {
                      borderColor: draft[field.key] === '' ? theme.colors.primary : theme.colors.border,
                      backgroundColor:
                        draft[field.key] === '' ? `${theme.colors.primary}14` : theme.colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: draft[field.key] === '' ? theme.colors.primary : theme.colors.textMuted },
                    ]}
                  >
                    Default ({field.global})
                  </Text>
                </Pressable>
                {OPTIONS.map((value) => {
                  const active = draft[field.key] === String(value);
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setDraft((current) => ({ ...current, [field.key]: String(value) }))}
                      style={[
                        styles.option,
                        {
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                          backgroundColor: active ? `${theme.colors.primary}14` : theme.colors.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: active ? theme.colors.primary : theme.colors.textMuted },
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <PrimaryButton
            label={saveMutation.isPending ? 'Saving...' : 'Save'}
            loading={saveMutation.isPending}
            onPress={() => saveMutation.mutate()}
            style={styles.save}
          />
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
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  headerSide: { minWidth: 56 },
  headerRight: { alignItems: 'flex-end' },
  reset: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700' },
  hint: { marginBottom: 12 },
  globalNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  field: { marginBottom: 16, gap: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionText: { fontSize: 12, fontWeight: '700' },
  save: { marginTop: 4, marginBottom: 8, borderRadius: designSystem.formRadius },
});
