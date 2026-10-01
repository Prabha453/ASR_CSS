import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EntitiesStackParamList } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { getProfileInitials } from '@/features/settings/utils/settings.utils';
import { AppHeader, ScreenShell } from '@/shared/components/layout';
import { designSystem } from '@/shared/theme/designSystem';
import { fontWeight } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';
import { EntityModuleCard } from '../components/EntityModuleCard';
import { ENTITY_MODULES } from '../constants/entity.constants';

type Props = NativeStackScreenProps<EntitiesStackParamList, 'EntitiesHub'>;

export function EntitiesHubScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const profile = useAppSelector((state) => state.user.profile);
  const initials = getProfileInitials(profile);
  const [search, setSearch] = useState('');

  const modules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ENTITY_MODULES;
    return ENTITY_MODULES.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.statusLabel.toLowerCase().includes(query),
    );
  }, [search]);

  const handlePress = (item: (typeof ENTITY_MODULES)[number]) => {
    if (!item.route) return;
    if (item.route === 'OfficialsDetail') {
      navigation.navigate('OfficialsDetail', { name: 'Officials' });
      return;
    }
    if (item.route === 'ModulePlaceholder') {
      navigation.navigate('ModulePlaceholder', {
        title: item.title,
        description: item.placeholderDescription,
      });
      return;
    }
    navigation.navigate(item.route);
  };

  return (
    <ScreenShell
      contentStyle={styles.content}
      edges={['left', 'right']}
      header={
        <AppHeader
          title="Entities"
          leftAction="menu"
          showNotifications
          notificationCount={3}
          showProfile
          profileInitials={initials}
        />
      }
    >
      <LinearGradient
        colors={['#eef3ff', '#f7f9fc', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: '#e3e9f5' }]}
      >
        <View style={styles.heroPattern} />
        <View style={styles.heroPatternRing} />

        <View style={styles.heroText}>
          <Text style={styles.heroEyebrow}>REGISTRY MODULES</Text>
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            Open a module to manage entity records.
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textMuted }]}>
            View, update and manage records across your portfolio.
          </Text>
        </View>

        <View style={styles.heroArt}>
          <View style={[styles.docStack, styles.docBack]} />
          <View style={[styles.docStack, styles.docMid]} />
          <View style={[styles.docStack, styles.docFront]}>
            <View style={styles.docLine} />
            <View style={[styles.docLine, styles.docLineShort]} />
            <View style={[styles.docLine, { width: '55%' }]} />
          </View>
          <View style={styles.buildingBadge}>
            <Ionicons name="business" size={12} color="#3577f1" />
          </View>
        </View>
      </LinearGradient>

      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search modules..."
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.searchInput, { color: theme.colors.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <View style={[styles.searchDivider, { backgroundColor: theme.colors.border }]} />
        <Pressable hitSlop={8} accessibilityLabel="Filter modules" style={styles.filterHit}>
          <Ionicons name="funnel-outline" size={16} color={theme.colors.secondary} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {modules.map((item) => (
          <EntityModuleCard
            key={item.id}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            accent={item.accent}
            comingSoon={item.comingSoon}
            onPress={item.comingSoon ? undefined : () => handlePress(item)}
          />
        ))}
      </View>

      {modules.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
          No modules match “{search.trim()}”.
        </Text>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: designSystem.screenPadding,
    paddingBottom: designSystem.screenPadding,
  },
  hero: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minHeight: 120,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPattern: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(53,119,241,0.06)',
    right: -36,
    top: -54,
  },
  heroPatternRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: 'rgba(53,119,241,0.12)',
    right: 40,
    bottom: -30,
  },
  heroText: {
    flex: 1,
    paddingRight: 10,
    zIndex: 1,
  },
  heroEyebrow: {
    color: '#3577f1',
    fontSize: 11,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: fontWeight.bold,
    lineHeight: 23,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: fontWeight.medium,
  },
  heroArt: {
    width: 68,
    height: 74,
    zIndex: 1,
  },
  docStack: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
  },
  docBack: {
    width: 42,
    height: 52,
    right: 0,
    top: 4,
    backgroundColor: '#dbe7ff',
    borderColor: '#c5d6f8',
    transform: [{ rotate: '10deg' }],
  },
  docMid: {
    width: 44,
    height: 54,
    right: 8,
    top: 8,
    backgroundColor: '#edf3ff',
    borderColor: '#d5e2fa',
    transform: [{ rotate: '4deg' }],
  },
  docFront: {
    width: 46,
    height: 56,
    right: 14,
    top: 12,
    backgroundColor: '#fff',
    borderColor: '#d9e4f7',
    paddingHorizontal: 8,
    paddingTop: 12,
    gap: 5,
  },
  docLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#c9d8f5',
    width: '100%',
  },
  docLineShort: {
    width: '70%',
  },
  buildingBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d9e4f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 6,
    minHeight: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  searchDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 10,
  },
  filterHit: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 13,
  },
});
