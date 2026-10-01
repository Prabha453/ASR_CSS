import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { FormField } from './FormField';
import { TextInput, TextInputProps } from './TextInput';

export type DateInputProps = Omit<TextInputProps, 'keyboardType'> & {
  onPress?: () => void;
};

export function DateInput({ onPress, ...props }: DateInputProps) {
  const { theme } = useTheme();

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <FormField
        label={props.label}
        error={props.error}
        required={props.required}
        containerStyle={props.containerStyle as ViewStyle}
      >
        <TextInput
          {...props}
          label={undefined}
          error={undefined}
          required={undefined}
          containerStyle={undefined}
          editable={false}
          placeholder={props.placeholder ?? 'YYYY-MM-DD'}
          style={[
            props.style,
            {
              color: theme.colors.text,
            },
          ]}
        />
      </FormField>
    </Pressable>
  );
}

const _styles = StyleSheet.create({});
