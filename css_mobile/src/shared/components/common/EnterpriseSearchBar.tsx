import { Pressable, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { designSystem } from '@/shared/theme/designSystem';
import { useTheme } from '@/shared/theme/ThemeContext';

type EnterpriseSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
};

export function EnterpriseSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}: EnterpriseSearchBarProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.card,
        },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.input, { color: theme.colors.text }]}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: designSystem.formHeight,
    borderRadius: designSystem.formRadius,
    paddingHorizontal: designSystem.formPaddingH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#212529',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: designSystem.formFontSize,
    paddingVertical: 0,
  },
});
