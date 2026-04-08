import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notificationsApi';

export const notificationKeys = {
  my: (page: number, limit: number) => ['notifications', 'my', page, limit] as const,
};

export const useMyNotifications = (page = 1, limit = 20) =>
  useQuery({
    queryKey: notificationKeys.my(page, limit),
    queryFn: () => notificationsApi.getMy(page, limit),
  });
