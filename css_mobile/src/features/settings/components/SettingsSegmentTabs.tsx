import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type TabItem = {
  id: string;
  label: string;
};

type SettingsSegmentTabsProps<T extends string> = {
  tabs: readonly TabItem[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
};

export function SettingsSegmentTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: SettingsSegmentTabsProps<T>) {
  const { theme } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id as T)}
            style={[
              styles.tab,
              {
                backgroundColor: active ? theme.colors.primary : theme.colors.card,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: active ? '#fff' : theme.colors.text }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  wrap: {
    gap: 8,
    paddingBottom: 16,
  },
  tab: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

