import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { COMPANY_RISK_META } from '../constants/company.constants';
import { Company } from '../types/company.types';
import { getCompanyAvatarColor, getCompanyInitials, getCompanyUen } from '../utils/company.utils';
import { CompanyStatusBadge } from './CompanyStatusBadge';

const CARD_HEIGHT = 156;

type CompanyGridCardProps = {
  company: Company;
  width: number;
  onPress: () => void;
  onMenuPress?: () => void;
};

export function CompanyGridCard({ company, width, onPress, onMenuPress }: CompanyGridCardProps) {
  const { theme } = useTheme();
  const name = company.name ?? '—';
  const uen = getCompanyUen(company);
  const country = company.company_detail?.country;
  const risk = company.company_detail?.risk_assessment_rating;
  const riskMeta = risk ? COMPANY_RISK_META[risk] : undefined;
  const avatarColor = getCompanyAvatarColor(name);
  const initials = getCompanyInitials(name) || '?';

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    onPress();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, { width, opacity: pressed ? 0.92 : 1 }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={styles.identity}>
            <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
              {name}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {uen ? `UEN ${uen}` : company.client_no ? `Client ${company.client_no}` : 'No UEN'}
            </Text>
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <CompanyStatusBadge status={company.status} />
          {country ? (
            <View style={[styles.metaBadge, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="globe-outline" size={11} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {country}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <View style={styles.footerItem}>
            <Ionicons name="shield-outline" size={13} color={riskMeta?.color ?? theme.colors.textMuted} />
            <Text
              style={[styles.footerText, { color: riskMeta?.color ?? theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {riskMeta ? riskMeta.label.replace(' Risk', '') : 'No risk'}
            </Text>
          </View>
          {company.client_no ? (
            <View style={styles.footerItem}>
              <Ionicons name="id-card-outline" size={13} color={theme.colors.textMuted} />
              <Text style={[styles.footerText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {company.client_no}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const COMPANY_GRID_CARD_HEIGHT = CARD_HEIGHT;

const styles = StyleSheet.create({
  wrap: {
    height: CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  identity: {
    flex: 1,
    gap: 3,
    paddingTop: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    marginRight: -4,
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
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 1,
    maxWidth: '50%',
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
});
