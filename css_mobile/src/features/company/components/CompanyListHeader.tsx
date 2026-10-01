import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { CompanySearchToolbar } from './CompanySearchToolbar';

type CompanyListHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onFiltersPress: () => void;
  profileInitials?: string;
  hasActiveFilters?: boolean;
};

export function CompanyListHeader({
  search,
  onSearchChange,
  onFiltersPress,
  hasActiveFilters,
}: CompanyListHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.colors.primary }]}>
      <AppHeader
        title="Company List"
        subtitle="Manage and view all companies"
        titleAlign="left"
        leftAction="menu"
        showNotifications
        notificationCount={3}
      />
      <View style={styles.toolbarWrap}>
        <CompanySearchToolbar
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
