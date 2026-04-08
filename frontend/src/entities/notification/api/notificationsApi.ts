import { apiFetch } from '@shared/api/client';
import type { EmailNotification, PaginatedResult } from '@shared/types/api';

export const notificationsApi = {
  getMy: (page = 1, limit = 20) =>
    apiFetch<PaginatedResult<EmailNotification>>(
      `/notifications?page=${page}&limit=${limit}`,
    ),
};
