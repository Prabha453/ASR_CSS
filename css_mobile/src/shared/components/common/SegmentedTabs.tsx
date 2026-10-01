import { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { designSystem } from '@/shared/theme/designSystem';

type SegmentTab<T extends string> = {
  id: T;
  label: string;
};

type SegmentedTabsProps<T extends string> = {
  tabs: readonly SegmentTab<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
};

const TRACK_PADDING = 4;
const SEGMENT_GAP = 4;

export function SegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
}: SegmentedTabsProps<T>) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  const count = tabs.length;
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab),
  );

  const segmentWidth =
    count > 0
      ? (trackWidth - TRACK_PADDING * 2 - SEGMENT_GAP * (count - 1)) / count
      : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    Animated.spring(translateX, {
      toValue: activeIndex * (segmentWidth + SEGMENT_GAP),
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeIndex, segmentWidth, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.track} onLayout={handleLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            styles.segmentActive,
            {
              width: segmentWidth,
              backgroundColor: theme.colors.card,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}

      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={[
                styles.label,
                { color: active ? theme.colors.primary : theme.colors.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: '#eef0f4',
    borderRadius: 12,
    padding: TRACK_PADDING,
    marginBottom: designSystem.sectionGap,
    gap: SEGMENT_GAP,
  },
  indicator: {
    position: 'absolute',
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    bottom: TRACK_PADDING,
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  segmentActive: {
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
