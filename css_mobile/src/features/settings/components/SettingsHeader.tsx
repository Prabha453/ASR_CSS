import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const headerBg = require('@/assets/images/login-hero-bg.png');

type SettingsHeaderProps = {
  initials: string;
  subtitle?: string;
};

export function SettingsHeader({ initials, subtitle }: SettingsHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <Image source={headerBg} style={styles.backgroundImage} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(42, 53, 88, 0.78)', 'rgba(64, 81, 137, 0.88)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} accessibilityLabel="Menu">
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </Pressable>

          <View style={styles.actions}>
            <Pressable style={styles.iconButton} accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={21} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>

            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'AS'}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>{subtitle ?? 'Manage your system preferences'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -16,
    marginTop: -16,
    minHeight: 190,
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    width: '100%',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#405189',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0ab39c',
    borderWidth: 2,
    borderColor: '#405189',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
});
