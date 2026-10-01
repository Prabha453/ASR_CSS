import { StyleSheet, View } from 'react-native';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { EnterpriseSearchBar } from '@/shared/components/common/EnterpriseSearchBar';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type UsersListHeaderProps = {
  title: string;
  subtitle?: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onBack?: () => void;
};

export function UsersListHeader({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  onBack,
}: UsersListHeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <AppHeader
        title={title}
        subtitle={subtitle}
        titleAlign="left"
        leftAction={onBack ? 'back' : 'menu'}
        onLeftPress={onBack}
        showNotifications
        notificationCount={3}
      />

      <View style={styles.toolbarWrap}>
        <View style={styles.searchRow}>
          <EnterpriseSearchBar
            value={search}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            style={styles.searchBar}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbarWrap: {
    paddingHorizontal: designSystem.screenPadding,
    paddingBottom: designSystem.screenPadding,
  },
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
});
