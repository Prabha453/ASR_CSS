import { CompanyStatusTabs } from './CompanyStatusTabs';
import { CompanyKpis } from '../types/company.types';

type CompanyListSummaryProps = {
  status: string;
  kpis?: CompanyKpis;
  isLoading?: boolean;
  onStatusChange: (status: string) => void;
};

export function CompanyListSummary(props: CompanyListSummaryProps) {
  return <CompanyStatusTabs {...props} />;
}
