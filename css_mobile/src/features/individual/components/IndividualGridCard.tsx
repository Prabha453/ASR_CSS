import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_RISK_META } from '../constants/individual.constants';
import { Individual } from '../types/individual.types';
import {
  getIndividualAvatarColor,
  getIndividualInitials,
  getPrimaryIdNumber,
} from '../utils/individual.utils';
import { IndividualStatusBadge } from './IndividualStatusBadge';

const CARD_HEIGHT = 156;

type IndividualGridCardProps = {
  individual: Individual;
  width: number;
  onPress: () => void;
  onMenuPress?: () => void;
};

export function IndividualGridCard({
  individual,
  width,
  onPress,
  onMenuPress,
}: IndividualGridCardProps) {
  const { theme } = useTheme();
  const name = individual.name ?? '—';
  const idNumber = getPrimaryIdNumber(individual);
  const nationality = individual.individual_detail?.member_nationality;
  const risk = individual.individual_detail?.member_assessment_rating;
  const riskMeta = risk ? INDIVIDUAL_RISK_META[risk] : undefined;
  const avatarColor = getIndividualAvatarColor(name);
  const initials = getIndividualInitials(name) || '?';

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
              {idNumber ? `ID ${idNumber}` : individual.client_no ? `Client ${individual.client_no}` : 'No ID'}
            </Text>
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <IndividualStatusBadge status={individual.status} />
          {nationality ? (
            <View
              style={[
                styles.metaBadge,
                { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="globe-outline" size={11} color={theme.colors.textMuted} />
              <Text style={[styles.metaText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {nationality}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <View style={styles.footerItem}>
            <Ionicons
              name="shield-outline"
              size={13}
              color={riskMeta?.color ?? theme.colors.textMuted}
            />
            <Text
              style={[styles.footerText, { color: riskMeta?.color ?? theme.colors.textMuted }]}
              numberOfLines={1}
            >
              {riskMeta ? riskMeta.label.replace(' Risk', '') : 'No risk'}
            </Text>
          </View>
          {individual.client_no ? (
            <View style={styles.footerItem}>
              <Ionicons name="id-card-outline" size={13} color={theme.colors.textMuted} />
              <Text style={[styles.footerText, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {individual.client_no}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const INDIVIDUAL_GRID_CARD_HEIGHT = CARD_HEIGHT;

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
