import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ThemeColors } from '@/shared/theme/colors';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';
import { COMPANY_STATUS_TABS } from '../constants/company.constants';
import { CompanyKpis } from '../types/company.types';

type TabColorKey = 'primary' | 'success' | 'textMuted' | 'warning';

const TAB_COLOR_KEYS: Record<string, TabColorKey> = {
  '': 'primary',
  ACTIVE: 'success',
  INACTIVE: 'textMuted',
  PENDING: 'warning',
};

function getTabColor(colors: ThemeColors, tabId: string) {
  const key = TAB_COLOR_KEYS[tabId] ?? 'primary';
  return colors[key];
}

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type CompanyStatusTabsProps = {
  status: string;
  kpis?: CompanyKpis;
  isLoading?: boolean;
  onStatusChange: (status: string) => void;
};

export function CompanyStatusTabs({
  status,
  kpis,
  isLoading,
  onStatusChange,
}: CompanyStatusTabsProps) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;

  const activeIndex = Math.max(
    0,
    COMPANY_STATUS_TABS.findIndex((tab) => tab.id === status),
  );
  const tabWidth = trackWidth > 0 ? trackWidth / COMPANY_STATUS_TABS.length : 0;

  const activeTab = COMPANY_STATUS_TABS[activeIndex];
  const indicatorColor = getTabColor(theme.colors, activeTab.id);

  useEffect(() => {
    if (tabWidth <= 0) return;
    Animated.spring(slideX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      tension: 180,
      friction: 20,
    }).start();
  }, [activeIndex, tabWidth, slideX]);

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
      onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {COMPANY_STATUS_TABS.map((tab, index) => {
        const active = status === tab.id;
        const count = kpis?.[tab.countKey] ?? 0;
        const tabColor = getTabColor(theme.colors, tab.id);
        const isLast = index === COMPANY_STATUS_TABS.length - 1;

        return (
          <View key={tab.id || 'all'} style={styles.segmentWrap}>
            <Pressable
              onPress={() => onStatusChange(tab.id)}
              style={[
                styles.segment,
                active && { backgroundColor: withAlpha(tabColor, 0.06) },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${tab.label}, ${count}`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={tabColor} />
              ) : (
                <View style={styles.inlineRow}>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: active ? tabColor : theme.colors.textMuted,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: withAlpha(tabColor, active ? 0.2 : 0.12),
                      },
                    ]}
                  >
                    <Text style={[styles.count, { color: tabColor }]} numberOfLines={1}>
                      {count.toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
            {!isLast ? (
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            ) : null}
          </View>
        );
      })}

      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.underline,
            {
              width: tabWidth,
              backgroundColor: indicatorColor,
              transform: [{ translateX: slideX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: designSystem.listGap,
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 2,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2.5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  segmentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 9,
    minHeight: 36,
    zIndex: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    paddingHorizontal: 1,
  },
  countBadge: {
    flexShrink: 0,
    height: 20,
    minWidth: 22,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  label: {
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
});
