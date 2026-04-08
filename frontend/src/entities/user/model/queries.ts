import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import { useAuthStore } from './auth.store';

export const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
  current: () => ['users', 'me'] as const,
};

export const useUser = (id: string) =>
  useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });

export const useCurrentUser = () => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: () => usersApi.getById(userId!),
    enabled: !!userId,
  });
};
