import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

export type KPICard = {
  id: string;
  label: string;
  value: string | number;
  color?: string;
};

type EntityKPICardsProps = {
  items: KPICard[];
};

export function EntityKPICards({ items }: EntityKPICardsProps) {
  const { theme } = useTheme();

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      initialNumToRender={4}
      windowSize={5}
      removeClippedSubviews
      renderItem={({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.value, { color: item.color ?? theme.colors.primary }]}>{item.value}</Text>
          <Text style={[styles.label, { color: theme.colors.textMuted }]}>{item.label}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingBottom: 8,
  },
  card: {
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
  },
  label: {
    marginTop: 4,
    fontSize: 12,
  },
});
