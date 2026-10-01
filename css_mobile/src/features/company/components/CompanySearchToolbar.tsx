import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EnterpriseSearchBar } from '@/shared/components/common/EnterpriseSearchBar';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type CompanySearchToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onFiltersPress: () => void;
  hasActiveFilters?: boolean;
};

export function CompanySearchToolbar({
  search,
  onSearchChange,
  onFiltersPress,
  hasActiveFilters,
}: CompanySearchToolbarProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.searchRow}>
      <EnterpriseSearchBar
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search name, UEN…"
        style={styles.searchBar}
      />

      <Pressable
        style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
        onPress={onFiltersPress}
        accessibilityLabel="Filter and sort companies"
      >
        <Ionicons name="options-outline" size={18} color={theme.colors.primary} />
        {hasActiveFilters ? <View style={styles.filterDot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    minHeight: designSystem.formHeight,
    borderRadius: designSystem.formRadius,
  },
  iconButton: {
    width: designSystem.formHeight,
    height: designSystem.formHeight,
    borderRadius: designSystem.formRadius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f06548',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
