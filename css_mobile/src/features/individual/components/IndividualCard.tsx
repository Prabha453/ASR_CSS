import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  INDIVIDUAL_RISK_META,
  INDIVIDUAL_STATUS_META,
} from '../constants/individual.constants';
import { Individual } from '../types/individual.types';
import {
  getIndividualAvatarColor,
  getIndividualInitials,
  getPrimaryIdNumber,
} from '../utils/individual.utils';
import { IndividualStatusBadge } from './IndividualStatusBadge';

type IndividualCardProps = {
  individual: Individual;
  compact?: boolean;
  onPress: () => void;
  onMenuPress?: () => void;
};

const RISK_BG: Record<string, string> = {
  LOW: '#EAFBF7',
  MEDIUM: '#FFF4E8',
  HIGH: '#FFE8E5',
  VERY_HIGH: '#FFE8E5',
};

export function IndividualCard({
  individual,
  compact = false,
  onPress,
  onMenuPress,
}: IndividualCardProps) {
  const { theme } = useTheme();
  const name = individual.name ?? '—';
  const idNumber = getPrimaryIdNumber(individual);
  const nationality = individual.individual_detail?.member_nationality;
  const risk = individual.individual_detail?.member_assessment_rating;
  const riskMeta = risk ? INDIVIDUAL_RISK_META[risk] : undefined;
  const avatarColor = getIndividualAvatarColor(name);
  const initials = getIndividualInitials(name);
  const inactiveBg = INDIVIDUAL_STATUS_META.INACTIVE.bg;

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    onPress();
  };

  return (
    <Pressable onPress={onPress} style={compact ? styles.compactWrap : undefined}>
      <EnterpriseCard style={compact ? styles.cardCompact : styles.card} padded>
        <View style={styles.topSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials || '?'}</Text>
          </View>

          <View style={styles.info}>
            <Text
              style={[textStyles.cardTitle, styles.name, { color: theme.colors.text }]}
              numberOfLines={2}
            >
              {name}
            </Text>
            <Text
              style={[textStyles.description, styles.metaLine, { color: theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {idNumber ? `ID: ${idNumber}` : 'ID: —'}
            </Text>
            {!compact ? (
              <Text
                style={[textStyles.description, styles.metaLine, { color: theme.colors.textMuted }]}
                numberOfLines={1}
              >
                {individual.client_no ? `Client No.: ${individual.client_no}` : 'Client No.: —'}
              </Text>
            ) : null}
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <IndividualStatusBadge status={individual.status} />
          {nationality ? (
            <View style={[styles.metaBadge, { backgroundColor: inactiveBg }]}>
              <Ionicons name="flag-outline" size={12} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {nationality}
              </Text>
            </View>
          ) : null}
          {riskMeta ? (
            <View style={[styles.metaBadge, { backgroundColor: RISK_BG[risk ?? ''] ?? '#FFE8E5' }]}>
              <Ionicons name="shield-outline" size={12} color={riskMeta.color} />
              <Text style={[styles.metaText, { color: riskMeta.color }]} numberOfLines={1}>
                {riskMeta.label.replace(' Risk', '')}
              </Text>
            </View>
          ) : null}
        </View>
      </EnterpriseCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    flex: 1,
    marginHorizontal: 4,
  },
  card: {
    padding: 12,
    marginBottom: designSystem.listGap,
  },
  cardCompact: {
    marginBottom: designSystem.listGap,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  info: {
    flex: 1,
    gap: 1,
    paddingTop: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 14,
  },
  metaLine: {
    fontSize: 11,
  },
  menuButton: {
    padding: 4,
    marginTop: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1,
    maxWidth: '42%',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});
