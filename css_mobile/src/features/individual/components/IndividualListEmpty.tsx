import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/shared/components/common/EmptyState';
import { PrimaryButton } from '@/shared/components/common/PrimaryButton';
import { designSystem } from '@/shared/theme/designSystem';

type IndividualListEmptyProps = {
  onAdd?: () => void;
};

export function IndividualListEmpty({ onAdd }: IndividualListEmptyProps) {
  return (
    <EmptyState
      icon="people-outline"
      title="No individuals found"
      description="Try adjusting your search or add a new individual."
      actionLabel={onAdd ? 'Add Individual' : undefined}
      onAction={onAdd}
      style={styles.wrap}
    />
  );
}

export function IndividualFab({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.fab}>
      <PrimaryButton round onPress={onPress} accessibilityLabel="Add Individual">
        <Ionicons name="add" size={26} color="#fff" />
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24,
  },
  fab: {
    position: 'absolute',
    right: designSystem.screenPadding,
    bottom: designSystem.screenPadding,
  },
});
