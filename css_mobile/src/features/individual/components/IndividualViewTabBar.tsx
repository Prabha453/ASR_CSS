import { useEffect, useRef } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/shared/theme/designSystem';
import { fontWeight } from '@/shared/theme/typography';
import { useTheme } from '@/shared/theme/ThemeContext';
import { INDIVIDUAL_VIEW_TABS, IndividualViewTabId } from '../constants/individual.constants';

type IndividualViewTabBarProps = {
  activeTab: IndividualViewTabId;
  onTabChange: (tab: IndividualViewTabId) => void;
  /** Tabs sit on the blue header (white active pill, translucent inactive). */
  onPrimary?: boolean;
};

export function IndividualViewTabBar({
  activeTab,
  onTabChange,
  onPrimary = false,
}: IndividualViewTabBarProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const tabX = useRef<Record<string, number>>({});

  useEffect(() => {
    const x = tabX.current[activeTab];
    if (x == null || !scrollRef.current) return;
    scrollRef.current.scrollTo({ x: Math.max(x - 20, 0), animated: true });
  }, [activeTab]);

  const handleTabLayout = (id: string, event: LayoutChangeEvent) => {
    tabX.current[id] = event.nativeEvent.layout.x;
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {INDIVIDUAL_VIEW_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <View
              key={tab.id}
              style={styles.tabItem}
              onLayout={(event) => handleTabLayout(tab.id, event)}
            >
              <Pressable
                onPress={() => onTabChange(tab.id)}
                style={[
                  styles.pill,
                  onPrimary
                    ? {
                        backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.14)',
                      }
                    : {
                        backgroundColor: active ? theme.colors.primary : theme.colors.card,
                        borderWidth: active ? 0 : 1,
                        borderColor: theme.colors.border,
                      },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={
                    onPrimary
                      ? active
                        ? theme.colors.primary
                        : 'rgba(255,255,255,0.92)'
                      : active
                        ? '#fff'
                        : theme.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: onPrimary
                        ? active
                          ? theme.colors.primary
                          : '#fff'
                        : active
                          ? '#fff'
                          : theme.colors.text,
                      fontWeight: active ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </Pressable>
              <View
                style={[
                  styles.underline,
                  {
                    backgroundColor:
                      onPrimary && active ? theme.colors.primary : 'transparent',
                  },
                ]}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 4,
  },
  row: {
    paddingHorizontal: designSystem.screenPadding,
    gap: 8,
    alignItems: 'flex-end',
  },
  tabItem: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
  },
  label: {
    fontSize: 13,
  },
  underline: {
    marginTop: 6,
    height: 3,
    width: 28,
    borderRadius: 2,
  },
});
