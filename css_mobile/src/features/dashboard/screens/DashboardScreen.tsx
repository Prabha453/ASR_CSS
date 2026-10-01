import { ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppSelector } from '@/app/store/hooks';
import type { DashboardStackParamList, MainTabParamList } from '@/app/navigation/types';
import { useOpenDrawer } from '@/app/navigation/useOpenDrawer';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useToast } from '@/shared/components/common/ToastProvider';
import { getProfileInitials } from '@/features/settings/utils/settings.utils';
import { QuickActionId } from '../constants/dashboard.constants';
import {
  ComplianceStatusCard,
  DashboardHero,
  EarningsOverviewCard,
  QuickActionsCard,
  RecentActivityCard,
  RecentEntitiesCard,
  StatCardsRow,
} from '../components';

type DashboardNav = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export function DashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<DashboardNav>();
  const openDrawer = useOpenDrawer();
  const { showToast } = useToast();
  const profile = useAppSelector((state) => state.user.profile);
  const initials = getProfileInitials(profile);

  const handleQuickAction = (id: QuickActionId) => {
    switch (id) {
      case 'add-company':
        navigation.navigate('CompanyTab', { screen: 'CompanyAdd' });
        break;
      case 'add-individual':
        navigation.navigate('CompanyTab', { screen: 'IndividualAdd' });
        break;
      case 'add-official':
        navigation.navigate('CompanyTab', { screen: 'OfficialsDetail', params: { name: 'Officials' } });
        break;
      case 'add-user':
        navigation.navigate('UsersTab', { screen: 'UserForm' });
        break;
      case 'reports':
        showToast('Reports are coming soon.', { type: 'info' });
        break;
    }
  };

  const goToEntities = () => navigation.navigate('CompanyTab', { screen: 'CompanyList' });

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <DashboardHero
          initials={initials}
          notificationCount={3}
          onMenu={openDrawer}
          onProfile={() =>
            navigation.navigate('SettingsTab', { screen: 'UserSettings', params: { tab: 'profile' } })
          }
        />

        <View style={[styles.body, { backgroundColor: theme.colors.background }]}>
          <StatCardsRow />

          <QuickActionsCard onAction={handleQuickAction} onViewAll={goToEntities} />

          <EarningsOverviewCard />
          <RecentActivityCard onViewMore={() => navigation.navigate('RecentActivity')} />
          <RecentEntitiesCard onViewAll={goToEntities} />
          <ComplianceStatusCard onViewAll={goToEntities} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 28,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    marginTop: -36,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
    zIndex: 2,
  },
});
