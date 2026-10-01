import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/store/hooks';
import { userGroupService } from '../services/userGroup.service';

export const userGroupsAllQueryKey = ['user-group', 'all'] as const;

export const useUserGroups = () => {
  const portDb = useAppSelector((state) => state.auth.portDb);

  return useQuery({
    queryKey: userGroupsAllQueryKey,
    queryFn: () => userGroupService.getAll(),
    enabled: Boolean(portDb),
    staleTime: 60_000,
  });
};
