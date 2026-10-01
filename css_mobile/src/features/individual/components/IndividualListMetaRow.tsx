import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

const TOGGLE_PADDING = 3;

type IndividualListMetaRowProps = {
  totalCount: number;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
};

export function IndividualListMetaRow({
  totalCount,
  viewMode,
  onViewModeChange,
}: IndividualListMetaRowProps) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const activeIndex = viewMode === 'list' ? 0 : 1;
  const segmentWidth = trackWidth > 0 ? (trackWidth - TOGGLE_PADDING * 2) / 2 : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    Animated.spring(slideX, {
      toValue: activeIndex * segmentWidth,
      useNativeDriver: true,
      tension: 160,
      friction: 18,
    }).start();
  }, [activeIndex, segmentWidth, slideX]);

  return (
    <View style={styles.row}>
      <Text style={[styles.count, { color: theme.colors.textMuted }]}>
        {totalCount > 0 ? (
          <>
            <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
              {totalCount.toLocaleString()}
            </Text>
            {` ${totalCount === 1 ? 'individual' : 'individuals'} found`}
          </>
        ) : (
          'No individuals found'
        )}
      </Text>

      <View
        style={[
          styles.toggle,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
        onLayout={(e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {segmentWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: segmentWidth,
                backgroundColor: theme.colors.primary,
                transform: [{ translateX: slideX }],
              },
            ]}
          />
        ) : null}

        <Pressable
          style={styles.toggleBtn}
          onPress={() => onViewModeChange('list')}
          accessibilityLabel="List view"
          accessibilityState={{ selected: viewMode === 'list' }}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={viewMode === 'list' ? '#fff' : theme.colors.textMuted}
          />
        </Pressable>
        <Pressable
          style={styles.toggleBtn}
          onPress={() => onViewModeChange('grid')}
          accessibilityLabel="Grid view"
          accessibilityState={{ selected: viewMode === 'grid' }}
        >
          <Ionicons
            name="grid-outline"
            size={16}
            color={viewMode === 'grid' ? '#fff' : theme.colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designSystem.listGap,
    gap: 12,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  toggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    padding: TOGGLE_PADDING,
    width: 76,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: TOGGLE_PADDING,
    left: TOGGLE_PADDING,
    bottom: TOGGLE_PADDING,
    borderRadius: 7,
  },
  toggleBtn: {
    flex: 1,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
