import { StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconName, IconTokenKey, iconTokens } from '@/shared/theme/iconTokens';
import { designSystem } from '@/shared/theme/designSystem';

type IconCircleProps = {
  name: IconName;
  token?: IconTokenKey;
  backgroundColor?: string;
  color?: string;
  size?: number;
  style?: ViewStyle;
};

export function IconCircle({
  name,
  token = 'primary',
  backgroundColor,
  color,
  size = designSystem.iconCircleSize,
  style,
}: IconCircleProps) {
  const preset = iconTokens[token];
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: designSystem.iconCircleRadius,
          backgroundColor: backgroundColor ?? preset.background,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize} color={color ?? preset.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
