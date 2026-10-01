import { ReactNode } from 'react';
import { Animated, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOpenDrawer } from '@/app/navigation/useOpenDrawer';
import { BackButton } from '@/shared/components/common/BackButton';
import { designSystem, headerShadow } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  leftAction?: 'back' | 'menu' | 'none';
  onLeftPress?: () => void;
  showNotifications?: boolean;
  notificationCount?: number;
  showProfile?: boolean;
  profileInitials?: string;
  rightAction?: ReactNode;
  titleAlign?: 'center' | 'left';
  subtitleOpacity?: Animated.AnimatedInterpolation<number> | Animated.Value;
  elevated?: boolean;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
};

export function AppHeader({
  title,
  subtitle,
  leftAction = 'none',
  onLeftPress,
  showNotifications = false,
  notificationCount = 0,
  showProfile = false,
  profileInitials = 'U',
  rightAction,
  titleAlign = 'center',
  subtitleOpacity,
  elevated = true,
  onNotificationPress,
  onProfilePress,
}: AppHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const openDrawer = useOpenDrawer();
  const leftAligned = titleAlign === 'left';
  const handleLeftPress = onLeftPress ?? (leftAction === 'menu' ? openDrawer : undefined);

  return (
    <View
      style={[
        styles.wrapper,
        elevated ? headerShadow : null,
        {
          backgroundColor: theme.colors.primary,
          paddingTop: insets.top,
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={[styles.bar, subtitle ? styles.barWithSubtitle : null]}>
        <View style={[styles.side, leftAligned ? styles.sideLeftAligned : null]}>
          {leftAction === 'back' ? (
            <BackButton variant="onPrimary" onPress={handleLeftPress ?? (() => undefined)} />
          ) : null}
          {leftAction === 'menu' ? (
            <Pressable
              style={styles.menuButton}
              onPress={handleLeftPress}
              accessibilityRole="button"
              accessibilityLabel="Menu"
              hitSlop={6}
            >
              <Ionicons name="menu" size={26} color="#fff" />
            </Pressable>
          ) : null}
          {leftAction === 'none' ? <View style={styles.sideSpacer} /> : null}
        </View>

        <View style={[styles.titleWrap, leftAligned ? styles.titleWrapLeft : null]}>
          <Text style={[styles.title, leftAligned ? styles.titleLeft : null]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Animated.Text
              style={[
                styles.subtitle,
                leftAligned ? styles.titleLeft : null,
                subtitleOpacity != null ? { opacity: subtitleOpacity } : null,
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Animated.Text>
          ) : null}
        </View>

        <View style={[styles.side, styles.rightSide]}>
          {rightAction}
          {showNotifications ? (
            <Pressable
              style={styles.iconButton}
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={21} color="#fff" />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
          {showProfile ? (
            <Pressable
              style={styles.avatar}
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Profile"
            >
              <Text style={styles.avatarText}>{profileInitials.slice(0, 2).toUpperCase()}</Text>
              <View style={styles.onlineDot} />
            </Pressable>
          ) : null}
          {!rightAction && !showNotifications && !showProfile ? (
            <View style={styles.sideSpacer} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  bar: {
    height: designSystem.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  barWithSubtitle: {
    height: 68,
    paddingVertical: 4,
  },
  side: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideLeftAligned: {
    width: 'auto',
    minWidth: 44,
  },
  rightSide: {
    justifyContent: 'flex-end',
    gap: 8,
  },
  sideSpacer: {
    width: 38,
    height: 38,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  titleWrapLeft: {
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  titleLeft: {
    textAlign: 'left',
  },
  title: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Poppins-SemiBold', android: 'Poppins_600SemiBold', default: undefined }),
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    top: 4,
    right: 4,
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0ab39c',
    borderWidth: 1.5,
    borderColor: '#405189',
  },
});
