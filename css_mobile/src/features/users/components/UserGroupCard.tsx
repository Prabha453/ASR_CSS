import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { textStyles } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { countPermissions } from '../constants/permissions.constants';
import { UserGroup } from '../types/userGroup.types';
import { parsePermissions } from '../utils/user.utils';

type UserGroupCardProps = {
  group: UserGroup;
  onPress: () => void;
  onMenuPress?: () => void;
};

export function UserGroupCard({ group, onPress, onMenuPress }: UserGroupCardProps) {
  const { theme } = useTheme();
  const { granted, total } = countPermissions(parsePermissions(group.permissions_json));

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
        <View style={styles.row}>
          <View style={[styles.icon, { backgroundColor: '#F3EEFF' }]}>
            <Ionicons name="people" size={20} color="#6559cc" />
          </View>

          <View style={styles.info}>
            <Text
              style={[textStyles.cardTitle, styles.name, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {group.group_name ?? '—'}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {group.group_description || 'No description'}
            </Text>
          </View>

          <Pressable style={styles.menuButton} onPress={handleMenu} hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>

        <View style={[styles.permBadge, { backgroundColor: `${theme.colors.primary}12` }]}>
          <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.primary} />
          <Text style={[styles.permText, { color: theme.colors.primary }]}>
            {granted} / {total} permissions
          </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '700',
    fontSize: 14,
  },
  description: {
    fontSize: 11,
  },
  menuButton: {
    padding: 4,
  },
  permBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  permText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
