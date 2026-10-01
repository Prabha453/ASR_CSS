import { StyleSheet } from 'react-native';
import { EmptyState } from '@/shared/components/common/EmptyState';

type CompanyListEmptyProps = {
  message?: string;
  onAddCompany?: () => void;
};

export function CompanyListEmpty({ message, onAddCompany }: CompanyListEmptyProps) {
  return (
    <EmptyState
      icon="business-outline"
      title="No companies found"
      description={message ?? 'Try adjusting your search or status filter.'}
      actionLabel={onAddCompany ? 'Add Company' : undefined}
      onAction={onAddCompany}
      style={styles.wrap}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 24,
  },
});
