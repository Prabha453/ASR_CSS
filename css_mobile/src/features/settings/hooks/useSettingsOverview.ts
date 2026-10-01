import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { settingsService } from '../services/settings.service';

export const SETTINGS_OVERVIEW_QUERY_KEY = ['settings', 'overview'] as const;

export const useSettingsOverview = () => {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useQuery({
    queryKey: [...SETTINGS_OVERVIEW_QUERY_KEY, portDb],
    queryFn: () => settingsService.getOverview(portDb),
    enabled: Boolean(portDb),
  });
};
