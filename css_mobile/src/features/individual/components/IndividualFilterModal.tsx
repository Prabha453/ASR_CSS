import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { formInputLayout } from '@/shared/components/formInputs/formInputStyles';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  INDIVIDUAL_RISK_FILTERS,
  INDIVIDUAL_SORT_OPTIONS,
  IndividualSortOption,
} from '../constants/individual.constants';

type IndividualFilterModalProps = {
  visible: boolean;
  risk: string;
  sort: IndividualSortOption;
  onClose: () => void;
  onApply: (risk: string, sort: IndividualSortOption) => void;
  onReset: () => void;
};

export function IndividualFilterModal({
  visible,
  risk,
  sort,
  onClose,
  onApply,
  onReset,
}: IndividualFilterModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [draftRisk, setDraftRisk] = useState(risk);
  const [draftSort, setDraftSort] = useState<IndividualSortOption>(sort);

  useEffect(() => {
    if (visible) {
      setDraftRisk(risk);
      setDraftSort(sort);
    }
  }, [visible, risk, sort]);

  const activeCount = draftRisk ? 1 : 0;

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
            <Pressable onPress={onReset} hitSlop={8} style={styles.headerSide}>
              <Text style={[styles.resetLink, { color: theme.colors.danger }]}>Reset</Text>
            </Pressable>
            <Text style={[styles.title, { color: theme.colors.text }]}>Filter & Sort</Text>
            <Pressable onPress={onClose} hitSlop={8} style={[styles.headerSide, styles.headerRight]}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Risk Rating</Text>
            <View style={styles.chips}>
              {INDIVIDUAL_RISK_FILTERS.map((filter) => {
                const active = draftRisk === filter.id;
                return (
                  <Pressable
                    key={filter.id || 'all'}
                    onPress={() => setDraftRisk(filter.id)}
                    style={[
                      formInputLayout.chip,
                      {
                        backgroundColor: active ? theme.colors.primary : theme.colors.background,
                        borderColor: active ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        formInputLayout.chipText,
                        { color: active ? '#fff' : theme.colors.text },
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Sort By</Text>
            <View style={styles.sortList}>
              {INDIVIDUAL_SORT_OPTIONS.map((option, index) => {
                const active = draftSort === option.id;
                const isLast = index === INDIVIDUAL_SORT_OPTIONS.length - 1;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setDraftSort(option.id)}
                    style={[
                      styles.sortOption,
                      !isLast && {
                        borderBottomColor: theme.colors.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortText,
                        { color: theme.colors.text, fontWeight: active ? '700' : '500' },
                      ]}
                    >
                      {option.label}
                    </Text>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: active ? theme.colors.primary : theme.colors.border },
                      ]}
                    >
                      {active ? (
                        <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={activeCount ? `Apply (${activeCount})` : 'Apply'}
              onPress={() => onApply(draftRisk, draftSort)}
              style={styles.applyButton}
              contentStyle={styles.applyContent}
            />
          </View>
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
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 8,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginBottom: 12,
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
  sortList: {
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sortText: {
    fontSize: 15,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
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
