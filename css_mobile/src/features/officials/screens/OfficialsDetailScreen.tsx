import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { AppHeader } from '@/shared/components/layout/AppHeader';
import { DetailHeroCard } from '@/shared/components/common/DetailHeroCard';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';
import { getCompanyAvatarColor, getCompanyInitials } from '@/features/company/utils/company.utils';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'OfficialsDetail'>;

const OFFICIALS = [
  { name: 'Sarah Tan', role: 'Director', status: 'Active' },
  { name: 'Michael Lee', role: 'Secretary', status: 'Active' },
  { name: 'Priya Kumar', role: 'Shareholder', status: 'Pending' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: '#EAFBF7', text: '#0ab39c' },
  Pending: { bg: '#FFF4E8', text: '#f7b84b' },
};

export function OfficialsDetailScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const title = route.params?.name ?? 'Officials Details';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AppHeader
        title="Officials"
        leftAction="back"
        onLeftPress={() => navigation.goBack()}
        showNotifications
        showProfile
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <DetailHeroCard
          title={title}
          subtitle="Entity officials & appointments"
          meta={
            <Text style={styles.heroMeta}>{OFFICIALS.length} officials on record</Text>
          }
        />

        {OFFICIALS.map((item) => {
          const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.Pending;
          const avatarColor = getCompanyAvatarColor(item.name);
          const initials = getCompanyInitials(item.name) || '?';

          return (
            <EnterpriseCard key={item.name} padded style={styles.card}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.role, { color: theme.colors.textMuted }]}>{item.role}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>{item.status}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </EnterpriseCard>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: {
    padding: designSystem.screenPadding,
    paddingBottom: designSystem.sectionGap * 2,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: designSystem.cardGap,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  role: {
    fontSize: 13,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
