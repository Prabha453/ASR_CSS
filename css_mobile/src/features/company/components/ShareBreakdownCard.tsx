import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { EntityShare } from '../types/entityShare.types';

const BAR_COLORS = ['#f7b84b', '#f06548', '#405189', '#0ab39c', '#299cdb', '#6559cc'];
const PAGE_SIZE = 2;

type ShareBreakdownCardProps = {
  shares: EntityShare[];
};

type BreakdownRow = {
  key: string;
  title: string;
  amount: number;
  pct: number;
  currency: string;
};

function buildByType(shares: EntityShare[]): BreakdownRow[] {
  const allGuar = shares.every((share) => share.share_type === 'GUARANTEE');
  const getValue = (share: EntityShare) =>
    allGuar ? Number(share.guarantee_amount) || 0 : Number(share.number_of_shares) || 0;

  const grouped: Record<string, { amount: number; currency: string; type: string; classType: string }> = {};

  shares.forEach((share) => {
    const type = share.share_class?.sc_name || share.share_type || 'Share';
    const classType = share.share_class?.sc_type || '';
    const key = `${type}__${classType}__${share.currency || ''}`;
    if (!grouped[key]) {
      grouped[key] = {
        amount: 0,
        currency: share.currency || '',
        type,
        classType,
      };
    }
    grouped[key].amount += getValue(share);
  });

  const total = Object.values(grouped).reduce((sum, row) => sum + row.amount, 0);

  return Object.entries(grouped)
    .map(([key, row]) => ({
      key,
      title: row.classType ? `${row.type} • ${row.classType}` : row.type,
      amount: row.amount,
      pct: total > 0 ? (row.amount / total) * 100 : 0,
      currency: row.currency,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function ShareBreakdownCard({ shares }: ShareBreakdownCardProps) {
  const { theme } = useTheme();
  const [page, setPage] = useState(0);
  const rows = useMemo(() => buildByType(shares), [shares]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  if (!rows.length) {
    return null;
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Share Distribution</Text>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textMuted} />
        </View>
        <Pressable style={[styles.modePill, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.modeText, { color: theme.colors.text }]}>By Type</Text>
          <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {visible.map((row, index) => {
          const color = BAR_COLORS[(page * PAGE_SIZE + index) % BAR_COLORS.length];
          return (
            <View key={row.key} style={styles.row}>
              <View style={styles.rowTop}>
                <View style={styles.rowLabel}>
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={[styles.rowTitle, { color: theme.colors.text }]} numberOfLines={1}>
                    {row.title}
                  </Text>
                </View>
                <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {row.currency || '—'} {row.amount.toLocaleString()} • {row.pct.toFixed(1)}%
                </Text>
              </View>
              <View style={[styles.track, { backgroundColor: `${color}22` }]}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.min(row.pct, 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {pageCount > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: pageCount }).map((_, index) => (
            <Pressable
              key={index}
              onPress={() => setPage(index)}
              style={[
                styles.dotPage,
                {
                  backgroundColor:
                    index === page ? theme.colors.primary : 'rgba(135,138,153,0.35)',
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 14,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 14,
  },
  row: {
    gap: 8,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  track: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dotPage: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
