import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';
// import { DASHBOARD_DATE_LABEL } from '../constants/dashboard.constants';

type DashboardHeroProps = {
  initials: string;
  notificationCount?: number;
  onMenu?: () => void;
  onNotifications?: () => void;
  onProfile?: () => void;
};

export function DashboardHero({
  initials,
  notificationCount = 0,
  onMenu,
  onNotifications,
  onProfile,
}: DashboardHeroProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[...theme.colors.primaryGradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.menuButton} onPress={onMenu} accessibilityLabel="Menu" hitSlop={6}>
          <Ionicons name="menu" size={26} color="#fff" />
        </Pressable>

        <View style={styles.brandWrap}>
          <Text style={styles.brand}>ASR CSS</Text>
          <Text style={styles.brandSub}>ASR CSS Management System</Text>
        </View>

        <View style={styles.topActions}>
          <Pressable style={styles.iconButton} onPress={onNotifications} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {notificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable style={styles.avatar} onPress={onProfile} accessibilityLabel="Profile">
            <Text style={styles.avatarText}>{initials.slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.subtitle}>
          Here's what's happening with your Corporate Secretary services today.
        </Text>

        {/* Date filter (hidden for now)
        <View style={styles.datePill}>
          <Ionicons name="calendar-outline" size={14} color="#fff" />
          <Text style={styles.datePillText}>{DASHBOARD_DATE_LABEL}</Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
        </View>
        */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  brandWrap: {
    flex: 1,
    marginLeft: 6,
  },
  brand: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f06548',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#4a54a0',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  greetingBlock: {
    marginTop: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: '92%',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  datePillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
