import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { designSystem, textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import {
  COMPANY_RISK_META,
  COMPANY_STATUS_META,
} from '../constants/company.constants';
import { Company } from '../types/company.types';
import { getCompanyAvatarColor, getCompanyUen } from '../utils/company.utils';
import { CompanyStatusBadge } from './CompanyStatusBadge';

type CompanyCardProps = {
  company: Company;
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

export function CompanyCard({ company, compact = false, onPress, onMenuPress }: CompanyCardProps) {
  const { theme } = useTheme();
  const name = company.name ?? '—';
  const uen = getCompanyUen(company);
  const country = company.company_detail?.country;
  const risk = company.company_detail?.risk_assessment_rating;
  const riskMeta = risk ? COMPANY_RISK_META[risk] : undefined;
  const avatarColor = getCompanyAvatarColor(company.name ?? '');
  const inactiveBg = COMPANY_STATUS_META.INACTIVE.bg;

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
            <Ionicons name="business" size={20} color="#fff" />
          </View>

          <View style={styles.info}>
            <Text
              style={[textStyles.cardTitle, styles.name, { color: theme.colors.text }]}
              numberOfLines={compact ? 2 : 2}
            >
              {name}
            </Text>
            <Text style={[textStyles.description, styles.metaLine, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {uen ? `UEN: ${uen}` : 'UEN: —'}
            </Text>
            {!compact ? (
              <Text style={[textStyles.description, styles.metaLine, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {company.client_no ? `Client No.: ${company.client_no}` : 'Client No.: —'}
              </Text>
            ) : null}
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <CompanyStatusBadge status={company.status} />
          {country ? (
            <View style={[styles.metaBadge, { backgroundColor: inactiveBg }]}>
              <Ionicons name="flag-outline" size={12} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {country}
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
