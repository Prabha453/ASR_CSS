import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { IndividualSearchToolbar } from './IndividualSearchToolbar';

type IndividualListHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onFiltersPress: () => void;
  hasActiveFilters?: boolean;
};

export function IndividualListHeader({
  search,
  onSearchChange,
  onFiltersPress,
  hasActiveFilters,
}: IndividualListHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.primary }]}>
      <AppHeader
        title="Individuals"
        subtitle="Manage and view all individuals"
        titleAlign="left"
        leftAction="menu"
        showNotifications
        notificationCount={3}
      />
      <View style={styles.toolbarWrap}>
        <IndividualSearchToolbar
          search={search}
          onSearchChange={onSearchChange}
          onFiltersPress={onFiltersPress}
          hasActiveFilters={hasActiveFilters}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  toolbarWrap: {
    paddingHorizontal: designSystem.screenPadding,
    paddingBottom: designSystem.screenPadding,
  },
});
