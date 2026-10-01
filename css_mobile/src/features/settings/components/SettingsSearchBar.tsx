import { StyleSheet, View } from 'react-native';
import { EnterpriseSearchBar } from '@/shared/components/common/EnterpriseSearchBar';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type SettingsSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SettingsSearchBar({ value, onChangeText }: SettingsSearchBarProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrap}>
      <EnterpriseSearchBar
        value={value}
        onChangeText={onChangeText}
        placeholder="Search settings..."
        style={{
          ...styles.search,
          borderColor: theme.colors.border,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -18,
    marginBottom: designSystem.formFieldGap + 6,
  },
  search: {
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: '#405189',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
});
