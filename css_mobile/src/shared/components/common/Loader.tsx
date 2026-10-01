import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

type LoaderProps = {
  fullScreen?: boolean;
  style?: ViewStyle;
};

export function Loader({ fullScreen, style }: LoaderProps) {
  const { theme } = useTheme();
  return (
    <View style={[fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
