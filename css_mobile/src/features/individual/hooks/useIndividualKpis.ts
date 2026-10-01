import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { individualService } from '../services/individual.service';

export const INDIVIDUAL_KPIS_QUERY_KEY = ['individual', 'kpis'] as const;

export function useIndividualKpis() {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useQuery({
    queryKey: INDIVIDUAL_KPIS_QUERY_KEY,
    queryFn: () => individualService.getKpis(),
    enabled: Boolean(portDb),
  });
}
