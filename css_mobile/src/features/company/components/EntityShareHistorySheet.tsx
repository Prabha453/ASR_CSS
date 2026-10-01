import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { entityShareService } from '../services/entityShare.service';
import { EntityShareHistory } from '../types/entityShare.types';
import { EffectiveDecimals, formatShareDate, formatShareNumber } from '../utils/entityShare.utils';

type EntityShareHistorySheetProps = {
  visible: boolean;
  entityId: number;
  shareId?: number;
  shareLabel?: string;
  decimals: EffectiveDecimals;
  onClose: () => void;
};

export function EntityShareHistorySheet({
  visible,
  entityId,
  shareId,
  shareLabel,
  decimals,
  onClose,
}: EntityShareHistorySheetProps) {
  const { theme } = useTheme();
  const [rows, setRows] = useState<EntityShareHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !entityId) return;
    setLoading(true);
    entityShareService
      .getHistory(entityId, { page: 1, limit: 100 })
      .then((result) => {
        const data = result.data as EntityShareHistory[];
        setRows(shareId ? data.filter((row) => row.entity_shares_id === shareId || row.id === shareId) : data);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [visible, entityId, shareId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Transaction History</Text>
              {shareLabel ? (
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {shareLabel}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
          ) : rows.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={28} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No transactions yet</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
              {rows.map((row) => (
                <View
                  key={`${row.id}-${row.created_at}`}
                  style={[styles.item, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                >
                  <View style={styles.itemHeader}>
                    <View style={[styles.badge, { backgroundColor: `${theme.colors.primary}14` }]}>
                      <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                        {row.transaction_type ?? 'transaction'}
                      </Text>
                    </View>
                    <Text style={[styles.date, { color: theme.colors.textMuted }]}>
                      {formatShareDate(row.created_at ?? row.date_of_transaction)}
                    </Text>
                  </View>
                  <View style={styles.grid}>
                    <HistoryMetric label="Shares" value={formatShareNumber(row.number_of_shares, decimals.shares)} />
                    <HistoryMetric label="Paid-up" value={`${row.currency ?? ''} ${formatShareNumber(row.paid_up_capital, decimals.paid)}`} />
                    <HistoryMetric label="Issued" value={formatShareNumber(row.issued_share_capital, decimals.issued)} />
                    <HistoryMetric label="Per Share" value={formatShareNumber(row.per_share, decimals.paid)} />
                  </View>
                  {row.delta_shares != null && row.delta_shares !== 0 ? (
                    <Text
                      style={[
                        styles.delta,
                        { color: row.delta_shares > 0 ? theme.colors.success : theme.colors.danger },
                      ]}
                    >
                      {row.delta_shares > 0 ? '+' : ''}
                      {formatShareNumber(row.delta_shares, decimals.shares)} shares
                    </Text>
                  ) : null}
                  {row.remarks ? (
                    <Text style={[styles.remarks, { color: theme.colors.textMuted }]}>{row.remarks}</Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  loader: {
    marginVertical: 28,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
  },
  list: {
    gap: 10,
    paddingBottom: 8,
  },
  item: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    minWidth: '44%',
    gap: 2,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  delta: {
    fontSize: 12,
    fontWeight: '700',
  },
  remarks: {
    fontSize: 12,
    lineHeight: 17,
  },
});
