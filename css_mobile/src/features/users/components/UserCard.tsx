import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { USER_ROLE_LABELS } from '../constants/user.constants';
import { User } from '../types/user.types';
import { getUserAvatarColor, getUserFullName, getUserInitials } from '../utils/user.utils';
import { UserStatusBadge } from './UserStatusBadge';

type UserCardProps = {
  user: User;
  groupName?: string;
  onPress: () => void;
  onMenuPress?: () => void;
};

export function UserCard({ user, groupName, onPress, onMenuPress }: UserCardProps) {
  const { theme } = useTheme();
  const name = getUserFullName(user);
  const avatarColor = getUserAvatarColor(user.email ?? user.user_name ?? name);
  const role = user.user_role ? USER_ROLE_LABELS[user.user_role] : undefined;

  const handleMenu = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }
    onPress();
  };

  return (
    <Pressable onPress={onPress}>
      <EnterpriseCard style={styles.card} padded>
        <View style={styles.topSection}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getUserInitials(user)}</Text>
          </View>

          <View style={styles.info}>
            <Text
              style={[textStyles.cardTitle, styles.name, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {user.user_name ? (
              <Text style={[styles.metaLine, { color: theme.colors.textMuted }]} numberOfLines={1}>
                @{user.user_name}
              </Text>
            ) : null}
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {user.email ?? '—'}
            </Text>
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.badgeRow}>
          <UserStatusBadge status={user.user_status} />
          {role ? (
            <View style={[styles.metaBadge, { backgroundColor: `${theme.colors.primary}12` }]}>
              <Ionicons name="ribbon-outline" size={12} color={theme.colors.primary} />
              <Text style={[styles.metaText, { color: theme.colors.primary }]} numberOfLines={1}>
                {role}
              </Text>
            </View>
          ) : null}
          {groupName ? (
            <View style={[styles.metaBadge, { backgroundColor: '#F3EEFF' }]}>
              <Ionicons name="people-outline" size={12} color="#6559cc" />
              <Text style={[styles.metaText, { color: '#6559cc' }]} numberOfLines={1}>
                {groupName}
              </Text>
            </View>
          ) : null}
        </View>
      </EnterpriseCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginBottom: 10,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '46%',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
});
