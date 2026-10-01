import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { companyService } from '../services/company.service';

export const COMPANY_KPIS_QUERY_KEY = ['company', 'kpis'] as const;

export const useCompanyKpis = () => {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useQuery({
    queryKey: COMPANY_KPIS_QUERY_KEY,
    queryFn: companyService.getKpis,
    enabled: Boolean(portDb),
  });
};
