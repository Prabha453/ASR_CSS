import { Pressable, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { ENTITY_SHARE_TYPE_META } from '../constants/entityShare.constants';
import { EntityShareType } from '../types/entityShare.types';

type EntityShareFilterBarProps = {
  currency: string;
  shareType: EntityShareType | '';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

function buildSummary(currency: string, shareType: EntityShareType | ''): string {
  const parts: string[] = [];
  if (currency) parts.push(currency);
  if (shareType) {
    parts.push(ENTITY_SHARE_TYPE_META[shareType]?.label ?? shareType);
  }
  return parts.length ? parts.join(' · ') : 'All shares';
}

export function EntityShareFilterBar({
  currency,
  shareType,
  onPress,
  style,
}: EntityShareFilterBarProps) {
  const { theme } = useTheme();
  const summary = buildSummary(currency, shareType);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.wrap,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        style,
      ]}
    >
      <Ionicons name="options-outline" size={16} color={theme.colors.primary} />
      <Text style={[styles.showing, { color: theme.colors.textMuted }]}>SHOWING</Text>
      <Text style={[styles.summary, { color: theme.colors.text }]} numberOfLines={1}>
        {summary}
      </Text>
      <Ionicons name="chevron-down" size={14} color={theme.colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  showing: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  summary: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
});
