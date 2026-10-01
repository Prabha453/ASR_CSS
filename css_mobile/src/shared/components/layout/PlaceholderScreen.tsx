import { StyleSheet, Text, View } from 'react-native';
import { PrimaryScreenShell } from './PrimaryScreenShell';
import { EnterpriseCard } from '@/shared/components/common/EnterpriseCard';
import { EmptyState } from '@/shared/components/common';
import { textStyles } from '@/shared/theme/designSystem';

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  description: string;
  onBack?: () => void;
};

export function PlaceholderScreen({ title, subtitle, description, onBack }: PlaceholderScreenProps) {
  return (
    <PrimaryScreenShell title={title} onBack={onBack}>
      <Text style={[textStyles.description, styles.subtitle]}>{subtitle}</Text>
      <EnterpriseCard padded>
        <EmptyState title={`${title} module`} description={description} />
      </EnterpriseCard>
    </PrimaryScreenShell>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: 16,
  },
});
