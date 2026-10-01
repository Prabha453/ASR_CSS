import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontWeight } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

type EntityModuleCardProps = {
  title: string;
  subtitle: string;
  icon: IoniconsName;
  accent: string;
  comingSoon?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function EntityModuleCard({
  title,
  subtitle,
  icon,
  accent,
  comingSoon,
  onPress,
  style,
}: EntityModuleCardProps) {
  const { theme } = useTheme();
  const disabled = comingSoon || !onPress;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: disabled ? 0.72 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}>
          <Ionicons name={icon} size={22} color={accent} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 14,
    minHeight: 84,
    overflow: 'hidden',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderRadius: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
    minHeight: 32,
  },
});
