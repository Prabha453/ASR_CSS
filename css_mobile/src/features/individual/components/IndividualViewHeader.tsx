import { ReactNode } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { designSystem } from '@/shared/theme/designSystem';
import { fontWeight } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';
import { getIndividualAvatarColor, getIndividualInitials } from '../utils/individual.utils';

type IndividualViewHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  tabs?: ReactNode;
};

export function IndividualViewHeader({
  title,
  subtitle = 'Individual Profile',
  onBack,
  tabs,
}: IndividualViewHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const avatarColor = getIndividualAvatarColor(title);
  const initials = getIndividualInitials(title) || '?';

  return (
    <LinearGradient
      colors={[...theme.colors.primaryGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 6 }]}
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.topRow}>
        <Pressable style={styles.iconBtn} onPress={onBack} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>

        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: '#fff' }]}>
            <Text style={[styles.avatarText, { color: avatarColor }]}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </View>
      </View>

      {tabs ? <View style={styles.tabs}>{tabs}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designSystem.screenPadding,
    gap: 10,
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: fontWeight.medium,
    marginTop: 1,
  },
  tabs: {
    marginTop: 2,
  },
});
