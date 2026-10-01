import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ENTITY_SHARE_TYPE_META } from '../constants/entityShare.constants';
import { EntityShare } from '../types/entityShare.types';
import { EffectiveDecimals, formatShareDate, formatShareNumber } from '../utils/entityShare.utils';

type EntityShareCardProps = {
  share: EntityShare;
  decimals: EffectiveDecimals;
  isAuthorizedCapital: boolean;
  onPressMenu: () => void;
};

export function EntityShareCard({
  share,
  decimals,
  isAuthorizedCapital,
  onPressMenu,
}: EntityShareCardProps) {
  const { theme } = useTheme();
  const typeMeta = ENTITY_SHARE_TYPE_META[share.share_type ?? 'NORMAL'] ?? ENTITY_SHARE_TYPE_META.NORMAL;
  const isGuarantee = share.share_type === 'GUARANTEE';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={[styles.classIcon, { backgroundColor: `${theme.colors.primary}12` }]}>
            <Ionicons name="layers-outline" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.titleWrap}>
            <Text style={[styles.className, { color: theme.colors.text }]} numberOfLines={1}>
              {share.share_class?.sc_name ?? `Class #${share.share_class_id}`}
            </Text>
            <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
              {formatShareDate(share.date_of_transaction)}
            </Text>
          </View>
        </View>
        <Pressable style={styles.menuBtn} onPress={onPressMenu} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.tagRow}>
        <View style={[styles.currencyPill, { backgroundColor: `${theme.colors.primary}14` }]}>
          <Text style={[styles.currencyText, { color: theme.colors.primary }]}>{share.currency}</Text>
        </View>
        <View style={[styles.typePill, { backgroundColor: typeMeta.bg }]}>
          <View style={[styles.typeDot, { backgroundColor: typeMeta.color }]} />
          <Text style={[styles.typeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
        </View>
        {share.share_class?.sc_type ? (
          <View style={[styles.classTypePill, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.classTypeText, { color: theme.colors.textMuted }]}>
              {share.share_class.sc_type}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metrics}>
        {isGuarantee ? (
          <>
            <Metric
              label="Guarantee Amount"
              value={formatShareNumber(share.guarantee_amount, decimals.paid)}
            />
            <Metric
              label="Per Share"
              value={formatShareNumber(share.per_share, decimals.paid)}
              highlight
            />
          </>
        ) : (
          <>
            <Metric
              label="Shares"
              value={formatShareNumber(share.number_of_shares, decimals.shares)}
            />
            <Metric
              label="Issued"
              value={formatShareNumber(share.issued_share_capital, decimals.issued)}
            />
            <Metric
              label="Paid-up"
              value={formatShareNumber(share.paid_up_capital, decimals.paid)}
            />
            <Metric
              label="Per Share"
              value={formatShareNumber(share.per_share, decimals.paid)}
              highlight
            />
            {isAuthorizedCapital ? (
              <Metric
                label="Authorized"
                value={formatShareNumber(share.authorized_share_capital, decimals.paid)}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          styles.metricValue,
          { color: highlight ? theme.colors.primary : theme.colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  classIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '800',
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  classTypePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  classTypeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  metric: {
    width: '50%',
    gap: 2,
    paddingRight: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
