import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SettingsMenuItem } from '../types/settings.types';

type SettingsMenuRowProps = {
  item: SettingsMenuItem;
  meta?: string;
  onPress: () => void;
};

export function SettingsMenuRow({ item, meta, onPress }: SettingsMenuRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
        <Ionicons name={item.icon} size={20} color={item.color} />
      </View>

      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {meta ?? item.description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
});
