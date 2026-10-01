import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { TextInput, TextInputProps } from './TextInput';

export type SearchInputProps = Omit<TextInputProps, 'returnKeyType'>;

export function SearchInput(props: SearchInputProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        returnKeyType="search"
        placeholder={props.placeholder ?? 'Search...'}
        style={[
          props.style,
          {
            backgroundColor: theme.colors.card,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
});
