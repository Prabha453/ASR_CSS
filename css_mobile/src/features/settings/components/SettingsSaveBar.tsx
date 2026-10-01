import { StyleSheet } from 'react-native';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';

type SettingsSaveBarProps = {
  label?: string;
  loading?: boolean;
  onPress: () => void;
};

export function SettingsSaveBar({ label = 'Save Changes', loading, onPress }: SettingsSaveBarProps) {
  return (
    <PrimaryButton
      label={loading ? 'Saving...' : label}
      loading={loading}
      onPress={onPress}
      disabled={loading}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 4,
    marginBottom: 24,
  },
});
