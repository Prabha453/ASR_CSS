import { TextInput, TextInputProps } from '@/shared/components/formInputs/TextInput';

export type SettingsFieldProps = TextInputProps & {
  label: string;
};

/** Settings forms use the same compact TextInput as every other screen. */
export function SettingsField({ label, ...props }: SettingsFieldProps) {
  return <TextInput label={label} {...props} />;
}
