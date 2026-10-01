import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ENTITY_SHARE_TYPE_META } from '../constants/entityShare.constants';
import { EntityShareType } from '../types/entityShare.types';

type EntityShareFilterSheetProps = {
  visible: boolean;
  currencies: string[];
  currency: string;
  shareType: EntityShareType | '';
  onClose: () => void;
  onApply: (currency: string, shareType: EntityShareType | '') => void;
  onReset: () => void;
};

const TYPE_FILTERS: { value: EntityShareType | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'GUARANTEE', label: 'Guarantee' },
];

export function EntityShareFilterSheet({
  visible,
  currencies,
  currency,
  shareType,
  onClose,
  onApply,
  onReset,
}: EntityShareFilterSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [draftCurrency, setDraftCurrency] = useState(currency);
  const [draftType, setDraftType] = useState<EntityShareType | ''>(shareType);

  useEffect(() => {
    if (visible) {
      setDraftCurrency(currency);
      setDraftType(shareType);
    }
  }, [visible, currency, shareType]);

  const activeCount = (draftCurrency ? 1 : 0) + (draftType ? 1 : 0);

  const handleReset = () => {
    setDraftCurrency('');
    setDraftType('');
    onReset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.card, paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={styles.header}>
            <Pressable onPress={handleReset} hitSlop={8} style={styles.headerSide}>
              <Text style={[styles.resetLink, { color: theme.colors.danger }]}>Reset</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>Filter Shares</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.headerSide, styles.headerRight]}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Currency</Text>
            <View style={styles.chips}>
              <FilterChip
                label="All"
                active={!draftCurrency}
                onPress={() => setDraftCurrency('')}
                color={theme.colors.primary}
              />
              {currencies.map((code) => (
                <FilterChip
                  key={code}
                  label={code}
                  active={draftCurrency === code}
                  onPress={() => setDraftCurrency(draftCurrency === code ? '' : code)}
                  color={theme.colors.primary}
                  icon="cash-outline"
                />
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Share Type</Text>
            <View style={styles.chips}>
              {TYPE_FILTERS.map((item) => {
                const meta = item.value ? ENTITY_SHARE_TYPE_META[item.value] : null;
                const active = draftType === item.value;
                const color = meta?.color ?? theme.colors.primary;
                return (
                  <FilterChip
                    key={item.value || 'all'}
                    label={item.label}
                    active={active}
                    onPress={() => setDraftType(item.value)}
                    color={color}
                    bg={meta?.bg}
                  />
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={activeCount ? `Apply (${activeCount})` : 'Apply'}
              onPress={() => onApply(draftCurrency, draftType)}
              style={styles.applyButton}
              contentStyle={styles.applyContent}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
  bg,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color: string;
  bg?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? color : theme.colors.border,
          backgroundColor: active ? (bg ?? `${color}18`) : theme.colors.background,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={13} color={active ? color : theme.colors.textMuted} />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: active ? color : theme.colors.textMuted },
          active && styles.chipTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 4,
  },
  headerSide: {
    minWidth: 56,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  resetLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    fontWeight: '800',
  },
  footer: {
    marginTop: 8,
  },
  applyButton: {
    borderRadius: 12,
  },
  applyContent: {
    height: 50,
  },
});
