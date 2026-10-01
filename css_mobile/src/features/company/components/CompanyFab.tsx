import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { designSystem } from '@/shared/theme/designSystem';

type CompanyFabProps = {
  onPress: () => void;
};

export function CompanyFab({ onPress }: CompanyFabProps) {
  return (
    <View style={styles.wrap}>
      <PrimaryButton round onPress={onPress} accessibilityLabel="Add Company">
        <Ionicons name="add" size={26} color="#fff" />
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: designSystem.screenPadding,
    bottom: designSystem.screenPadding,
  },
});
